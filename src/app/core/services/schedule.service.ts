import { Injectable, inject } from '@angular/core';
import { Auth, user as authUser } from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  doc,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { Schedule } from '../models/schedule.model';

export type NewSchedule = Omit<Schedule, 'id' | 'userId' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);

  readonly activeSchedules$: Observable<Schedule[]> = authUser(this.auth).pipe(
    switchMap((firebaseUser) => {
      if (!firebaseUser) {
        return of<Schedule[]>([]);
      }
      const schedulesQuery = query(
        collection(this.firestore, 'schedules'),
        where('userId', '==', firebaseUser.uid),
        where('isActive', '==', true)
      );
      return collectionData(schedulesQuery, { idField: 'id' }) as Observable<Schedule[]>;
    })
  );

  async addSchedule(schedule: NewSchedule): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Użytkownik niezalogowany');
    }

    await addDoc(collection(this.firestore, 'schedules'), {
      ...schedule,
      userId,
      createdAt: serverTimestamp(),
    });
  }

  async deactivateSchedule(scheduleId: string): Promise<void> {
    await updateDoc(doc(this.firestore, `schedules/${scheduleId}`), { isActive: false });
  }

  async refillStock(scheduleId: string, amount: number): Promise<void> {
    await updateDoc(doc(this.firestore, `schedules/${scheduleId}`), {
      stock: increment(amount),
    });
  }
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}
