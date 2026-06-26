import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserSettingsService } from '../../core/services/user-settings.service';

@Component({
  selector: 'app-settings',
  imports: [MatButtonModule, MatSlideToggleModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly authService = inject(AuthService);
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly settings = toSignal(this.userSettingsService.settings$);
  readonly accessibilityMode = signal(false);
  readonly darkMode = signal(false);

  constructor() {
    effect(() => {
      const enabled = this.settings()?.accessibilityMode;
      if (enabled !== undefined) {
        this.accessibilityMode.set(enabled);
      }
    });
    effect(() => {
      const theme = this.settings()?.theme;
      if (theme !== undefined) {
        this.darkMode.set(theme === 'dark');
      }
    });
  }

  async onAccessibilityModeChange(enabled: boolean): Promise<void> {
    this.accessibilityMode.set(enabled);
    try {
      await this.userSettingsService.setAccessibilityMode(enabled);
    } catch (error) {
      console.error('setAccessibilityMode failed', error);
      this.accessibilityMode.set(!enabled);
      this.snackBar.open('Nie udało się zapisać ustawienia. Spróbuj ponownie.', 'OK', {
        duration: 5000,
      });
    }
  }

  async onDarkModeChange(enabled: boolean): Promise<void> {
    this.darkMode.set(enabled);
    try {
      await this.userSettingsService.setTheme(enabled ? 'dark' : 'light');
    } catch (error) {
      console.error('setTheme failed', error);
      this.darkMode.set(!enabled);
      this.snackBar.open('Nie udało się zapisać ustawienia. Spróbuj ponownie.', 'OK', {
        duration: 5000,
      });
    }
  }
}
