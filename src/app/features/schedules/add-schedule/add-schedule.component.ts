import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { Medication } from '../../../core/models/schedule.model';
import { MedicationSearchService } from '../../../core/services/medication-search.service';
import { NewSchedule, ScheduleService, toTimestamp } from '../../../core/services/schedule.service';

const WEEK_DAYS = [
  { label: 'Pon', value: 1 },
  { label: 'Wt', value: 2 },
  { label: 'Śr', value: 3 },
  { label: 'Czw', value: 4 },
  { label: 'Pt', value: 5 },
  { label: 'Sob', value: 6 },
  { label: 'Nd', value: 0 },
];

function medicationSelectedValidator(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && control.value.trim().length > 0
    ? { invalidMedication: true }
    : null;
}

@Component({
  selector: 'app-add-schedule',
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './add-schedule.component.html',
  styleUrl: './add-schedule.component.scss',
})
export class AddScheduleComponent {
  private readonly fb = inject(FormBuilder);
  private readonly medicationSearchService = inject(MedicationSearchService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly router = inject(Router);

  readonly weekDays = WEEK_DAYS;
  readonly times = signal<string[]>([]);
  readonly newTime = signal('08:00');
  readonly isSaving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly medicationSearchControl = this.fb.control<string | Medication>('', {
    nonNullable: true,
    validators: [Validators.required, medicationSelectedValidator],
  });

  readonly searchResults = toSignal(
    this.medicationSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        const query = typeof value === 'string' ? value.trim() : '';
        return query.length >= 2 ? this.medicationSearchService.search(query) : of([]);
      })
    ),
    { initialValue: [] as Medication[] }
  );

  readonly form = this.fb.group({
    startDate: this.fb.control(new Date(), { nonNullable: true, validators: Validators.required }),
    hasEndDate: this.fb.control(false, { nonNullable: true }),
    endDate: this.fb.control<Date | null>(null),
    doseAmount: this.fb.control(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.1)],
    }),
    doseUnit: this.fb.control<'tabletka' | 'ml' | 'krople' | 'mg'>('tabletka', {
      nonNullable: true,
      validators: Validators.required,
    }),
    withFood: this.fb.control<'przed_posiłkiem' | 'po_posiłku' | 'na_czczo' | 'dowolnie'>(
      'dowolnie',
      { nonNullable: true, validators: Validators.required }
    ),
    frequencyType: this.fb.control<'daily' | 'weekly' | 'interval'>('daily', {
      nonNullable: true,
      validators: Validators.required,
    }),
    weeklyDays: this.fb.control<number[]>([], { nonNullable: true }),
    intervalDays: this.fb.control(2, { nonNullable: true, validators: Validators.min(1) }),
    hasStock: this.fb.control(false, { nonNullable: true }),
    stock: this.fb.control<number | null>(null),
    stockUnit: this.fb.control<'tabletki' | 'ml'>('tabletki', { nonNullable: true }),
    stockAlertAt: this.fb.control<number | null>(null),
    notes: this.fb.control('', { nonNullable: true }),
  });

  displayMedication(medication: Medication | string | null): string {
    if (!medication || typeof medication === 'string') {
      return medication ?? '';
    }
    return `${medication.name} ${medication.strength}`.trim();
  }

  onMedicationSelected(event: MatAutocompleteSelectedEvent): void {
    this.medicationSearchControl.setValue(event.option.value as Medication);
  }

  addTime(): void {
    const time = this.newTime();
    if (time && !this.times().includes(time)) {
      this.times.update((times) => [...times, time].sort());
    }
  }

  removeTime(time: string): void {
    this.times.update((times) => times.filter((t) => t !== time));
  }

  toggleWeekDay(day: number): void {
    const control = this.form.controls.weeklyDays;
    const current = control.value;
    control.setValue(
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    );
  }

  isWeekDaySelected(day: number): boolean {
    return this.form.controls.weeklyDays.value.includes(day);
  }

  async save(): Promise<void> {
    this.errorMessage.set(null);

    const medication = this.medicationSearchControl.value;
    const noWeekDaysSelected =
      this.form.controls.frequencyType.value === 'weekly' &&
      this.form.controls.weeklyDays.value.length === 0;

    if (
      this.medicationSearchControl.invalid ||
      this.form.invalid ||
      typeof medication === 'string' ||
      this.times().length === 0 ||
      noWeekDaysSelected
    ) {
      this.medicationSearchControl.markAsTouched();
      this.form.markAllAsTouched();
      if (this.times().length === 0) {
        this.errorMessage.set('Dodaj przynajmniej jedną godzinę dawkowania.');
      } else if (noWeekDaysSelected) {
        this.errorMessage.set('Wybierz przynajmniej jeden dzień tygodnia.');
      }
      return;
    }

    const values = this.form.getRawValue();
    const newSchedule: NewSchedule = {
      medication,
      startDate: toTimestamp(values.startDate),
      endDate: values.hasEndDate && values.endDate ? toTimestamp(values.endDate) : null,
      times: this.times(),
      doseAmount: values.doseAmount,
      doseUnit: values.doseUnit,
      withFood: values.withFood,
      frequency:
        values.frequencyType === 'weekly'
          ? { type: 'weekly', days: values.weeklyDays }
          : values.frequencyType === 'interval'
            ? { type: 'interval', intervalDays: values.intervalDays }
            : { type: 'daily' },
      stock: values.hasStock ? values.stock : null,
      stockUnit: values.hasStock ? values.stockUnit : null,
      stockAlertAt: values.hasStock ? values.stockAlertAt : null,
      notes: values.notes,
      isActive: true,
    };

    this.isSaving.set(true);
    try {
      await this.scheduleService.addSchedule(newSchedule);
      await this.router.navigateByUrl('/schedules');
    } catch {
      this.errorMessage.set('Nie udało się zapisać harmonogramu. Spróbuj ponownie.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
