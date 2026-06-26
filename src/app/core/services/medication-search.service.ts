import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { Medication } from '../models/schedule.model';

const MAX_RESULTS = 20;
const COMBINING_DIACRITICS = /[̀-ͯ]/g;

@Injectable({ providedIn: 'root' })
export class MedicationSearchService {
  private readonly http = inject(HttpClient);

  private readonly medications$ = this.http
    .get<Medication[]>('rpl-medications.json')
    .pipe(shareReplay(1));

  search(query: string): Observable<Medication[]> {
    const normalizedQuery = normalize(query);
    return this.medications$.pipe(
      map((medications) =>
        medications
          .filter((medication) => normalize(medication.name).includes(normalizedQuery))
          .slice(0, MAX_RESULTS)
      )
    );
  }
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(COMBINING_DIACRITICS, '');
}
