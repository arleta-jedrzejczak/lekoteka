import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Dose } from '../../core/models/dose.model';
import { Schedule } from '../../core/models/schedule.model';
import { DoseService } from '../../core/services/dose.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { DoseCardComponent } from './dose-card/dose-card.component';

@Component({
  selector: 'app-today',
  imports: [DoseCardComponent, MatProgressSpinnerModule],
  templateUrl: './today.component.html',
  styleUrl: './today.component.scss',
})
export class TodayComponent {
  private readonly doseService = inject(DoseService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isGenerating = signal(true);
  private hasGeneratedDoses = false;

  readonly schedules = toSignal(this.scheduleService.activeSchedules$);

  readonly schedulesById = computed(() => {
    const map = new Map<string, Schedule>();
    for (const schedule of this.schedules() ?? []) {
      if (schedule.id) {
        map.set(schedule.id, schedule);
      }
    }
    return map;
  });

  readonly doses = toSignal(this.doseService.todayDoses$, { initialValue: [] as Dose[] });

  constructor() {
    effect(() => {
      const schedules = this.schedules();
      if (schedules !== undefined && !this.hasGeneratedDoses) {
        this.hasGeneratedDoses = true;
        this.generateDoses(schedules);
      }
    });
  }

  private async generateDoses(schedules: Schedule[]): Promise<void> {
    try {
      await this.doseService.generateUpcomingDoses(schedules);
    } finally {
      this.isGenerating.set(false);
    }
  }

  async takeDose(dose: Dose): Promise<void> {
    const schedule = this.schedulesById().get(dose.scheduleId);
    if (!schedule || !dose.id) {
      return;
    }
    const { lowStock } = await this.doseService.confirmDose(dose, schedule);
    if (lowStock) {
      this.snackBar.open(
        `Zapas leku ${schedule.medication.name} się kończy — uzupełnij opakowanie.`,
        'OK',
        { duration: 6000 }
      );
    }
  }

  async skipDose(dose: Dose): Promise<void> {
    if (!dose.id) {
      return;
    }
    await this.doseService.skipDose(dose.id);
  }
}
