import { Timestamp } from '@angular/fire/firestore';

export interface Dose {
  id?: string;
  scheduleId: string;
  userId: string;
  medicationName: string;
  scheduledAt: Timestamp;
  takenAt: Timestamp | null;
  status: 'pending' | 'taken' | 'skipped';
  skippedReason: string | null;
  stockAfter: number | null;
}
