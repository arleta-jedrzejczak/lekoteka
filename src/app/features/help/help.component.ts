import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-help',
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
})
export class HelpComponent {}
