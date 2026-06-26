import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Dose } from '../../../core/models/dose.model';

@Component({
  selector: 'app-dose-card',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './dose-card.component.html',
  styleUrl: './dose-card.component.scss',
})
export class DoseCardComponent {
  readonly dose = input.required<Dose>();
  readonly take = output<void>();
  readonly skip = output<void>();

  get time(): string {
    return this.dose().scheduledAt.toDate().toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
