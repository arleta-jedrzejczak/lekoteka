import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { UserSettingsService } from './core/services/user-settings.service';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly authService = inject(AuthService);
  private readonly userSettingsService = inject(UserSettingsService);

  private readonly settings = toSignal(this.userSettingsService.settings$);

  constructor() {
    effect(() => {
      document.body.classList.toggle('accessibility-mode', this.settings()?.accessibilityMode === true);
      document.body.classList.toggle('dark-mode', this.settings()?.theme === 'dark');
    });
  }
}
