import { Timestamp } from '@angular/fire/firestore';

export interface Medication {
  rplId: string | null;
  name: string;
  form: string;
  strength: string;
  leafletUrl: string | null;
}

export interface Schedule {
  id?: string;
  userId: string;
  medication: Medication;
  startDate: Timestamp;
  endDate: Timestamp | null;
  times: string[];
  doseAmount: number;
  doseUnit: 'tabletka' | 'ml' | 'krople' | 'mg';
  withFood: 'przed_posiłkiem' | 'po_posiłku' | 'na_czczo' | 'dowolnie';
  frequency: {
    type: 'daily' | 'weekly' | 'interval';
    days?: number[];
    intervalDays?: number;
  };
  stock: number | null;
  stockUnit: 'tabletki' | 'ml' | null;
  stockAlertAt: number | null;
  notes: string;
  isActive: boolean;
  createdAt: Timestamp;
}
