import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  readonly isSigningIn = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async signIn(): Promise<void> {
    this.errorMessage.set(null);
    this.isSigningIn.set(true);
    try {
      await this.authService.signInWithGoogle();
    } catch {
      this.errorMessage.set('Logowanie nie powiodło się. Spróbuj ponownie.');
    } finally {
      this.isSigningIn.set(false);
    }
  }
}
