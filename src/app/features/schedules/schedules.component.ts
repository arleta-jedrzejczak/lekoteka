import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Schedule } from '../../core/models/schedule.model';
import { ScheduleService } from '../../core/services/schedule.service';
import {
  RefillStockDialogComponent,
  RefillStockDialogData,
} from './refill-stock-dialog/refill-stock-dialog.component';

const FREQUENCY_LABELS: Record<Schedule['frequency']['type'], string> = {
  daily: 'codziennie',
  weekly: 'w wybrane dni tygodnia',
  interval: 'co kilka dni',
};

@Component({
  selector: 'app-schedules',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.scss',
})
export class SchedulesComponent {
  private readonly scheduleService = inject(ScheduleService);
  private readonly dialog = inject(MatDialog);

  readonly schedules = toSignal(this.scheduleService.activeSchedules$, {
    initialValue: [] as Schedule[],
  });

  frequencyLabel(schedule: Schedule): string {
    return FREQUENCY_LABELS[schedule.frequency.type];
  }

  async deactivate(schedule: Schedule): Promise<void> {
    if (!schedule.id) {
      return;
    }
    await this.scheduleService.deactivateSchedule(schedule.id);
  }

  openRefillDialog(schedule: Schedule): void {
    if (!schedule.id) {
      return;
    }

    const dialogRef = this.dialog.open<
      RefillStockDialogComponent,
      RefillStockDialogData,
      number | undefined
    >(RefillStockDialogComponent, {
      data: { medicationName: schedule.medication.name, stockUnit: schedule.stockUnit },
    });

    dialogRef.afterClosed().subscribe((amount) => {
      if (amount && schedule.id) {
        this.scheduleService.refillStock(schedule.id, amount);
      }
    });
  }
}
