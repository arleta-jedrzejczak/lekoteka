import { Injectable, inject } from '@angular/core';
import { Auth, user as authUser } from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  doc,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, map, of, switchMap, take } from 'rxjs';
import { Dose } from '../models/dose.model';
import { Schedule } from '../models/schedule.model';

const UPCOMING_DAYS = 7;

@Injectable({ providedIn: 'root' })
export class DoseService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  readonly todayDoses$: Observable<Dose[]> = authUser(this.auth).pipe(
    switchMap((firebaseUser) => {
      if (!firebaseUser) {
        return of<Dose[]>([]);
      }
      const dosesQuery = query(collection(this.firestore, 'doses'), where('userId', '==', firebaseUser.uid));
      return (collectionData(dosesQuery, { idField: 'id' }) as Observable<Dose[]>).pipe(
        map((doses) => {
          const { start, end } = todayRange();
          return doses
            .filter((dose) => {
              const scheduledAt = dose.scheduledAt.toDate();
              return scheduledAt >= start && scheduledAt < end;
            })
            .sort((a, b) => a.scheduledAt.toMillis() - b.scheduledAt.toMillis());
        })
      );
    })
  );

  async generateUpcomingDoses(schedules: Schedule[]): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId || schedules.length === 0) {
      return;
    }

    const existingKeys = await this.fetchExistingDoseKeys(
      userId,
      schedules.map((s) => s.id!)
    );

    const { start: todayStart } = todayRange();
    for (const schedule of schedules) {
      if (!schedule.id) {
        continue;
      }
      for (let dayOffset = 0; dayOffset < UPCOMING_DAYS; dayOffset++) {
        const date = addDays(todayStart, dayOffset);
        if (!isScheduledOnDate(schedule, date)) {
          continue;
        }
        for (const time of schedule.times) {
          const scheduledAt = atTime(date, time);
          const key = doseKey(schedule.id, scheduledAt);
          if (existingKeys.has(key)) {
            continue;
          }
          await addDoc(collection(this.firestore, 'doses'), {
            scheduleId: schedule.id,
            userId,
            medicationName: schedule.medication.name,
            scheduledAt: Timestamp.fromDate(scheduledAt),
            takenAt: null,
            status: 'pending',
            skippedReason: null,
            stockAfter: null,
          });
        }
      }
    }
  }

  async confirmDose(
    dose: Dose,
    schedule: Schedule
  ): Promise<{ stockAfter: number | null; lowStock: boolean }> {
    const doseRef = doc(this.firestore, `doses/${dose.id}`);

    if (schedule.stock === null || !schedule.id) {
      await updateDoc(doseRef, { status: 'taken', takenAt: serverTimestamp(), stockAfter: null });
      return { stockAfter: null, lowStock: false };
    }

    const scheduleRef = doc(this.firestore, `schedules/${schedule.id}`);
    const stockAfter = await runTransaction(this.firestore, async (transaction) => {
      const scheduleSnapshot = await transaction.get(scheduleRef);
      const currentStock = (scheduleSnapshot.data()?.['stock'] as number | null) ?? 0;
      const newStock = currentStock - schedule.doseAmount;
      transaction.update(scheduleRef, { stock: newStock });
      transaction.update(doseRef, {
        status: 'taken',
        takenAt: serverTimestamp(),
        stockAfter: newStock,
      });
      return newStock;
    });

    const lowStock = schedule.stockAlertAt !== null && stockAfter <= schedule.stockAlertAt;
    return { stockAfter, lowStock };
  }

  async skipDose(doseId: string, reason: string | null = null): Promise<void> {
    await updateDoc(doc(this.firestore, `doses/${doseId}`), {
      status: 'skipped',
      skippedReason: reason,
    });
  }

  private async fetchExistingDoseKeys(userId: string, scheduleIds: string[]): Promise<Set<string>> {
    const keys = new Set<string>();
    for (const scheduleId of scheduleIds) {
      const dosesQuery = query(
        collection(this.firestore, 'doses'),
        where('userId', '==', userId),
        where('scheduleId', '==', scheduleId)
      );
      const doses = await firstValueFrom(
        collectionData(dosesQuery, { idField: 'id' }) as Observable<Dose[]>
      );
      for (const existingDose of doses) {
        keys.add(doseKey(scheduleId, existingDose.scheduledAt.toDate()));
      }
    }
    return keys;
  }
}

function firstValueFrom<T>(observable: Observable<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    observable.pipe(take(1)).subscribe({ next: resolve, error: reject });
  });
}

function todayRange(): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 1);
  return { start, end };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function atTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function doseKey(scheduleId: string, scheduledAt: Date): string {
  return `${scheduleId}|${scheduledAt.toISOString()}`;
}

function isScheduledOnDate(schedule: Schedule, date: Date): boolean {
  const startDate = schedule.startDate.toDate();
  startDate.setHours(0, 0, 0, 0);
  if (date < startDate) {
    return false;
  }
  if (schedule.endDate) {
    const endDate = schedule.endDate.toDate();
    endDate.setHours(23, 59, 59, 999);
    if (date > endDate) {
      return false;
    }
  }

  switch (schedule.frequency.type) {
    case 'daily':
      return true;
    case 'weekly':
      return (schedule.frequency.days ?? []).includes(date.getDay());
    case 'interval': {
      const intervalDays = schedule.frequency.intervalDays ?? 1;
      const daysSinceStart = Math.round((date.getTime() - startDate.getTime()) / 86_400_000);
      return daysSinceStart % intervalDays === 0;
    }
  }
}
