import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
  },
  {
    path: 'today',
    loadComponent: () => import('./features/today/today.component').then((m) => m.TodayComponent),
    canActivate: [authGuard],
  },
  {
    path: 'schedules',
    loadComponent: () =>
      import('./features/schedules/schedules.component').then((m) => m.SchedulesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'schedules/new',
    loadComponent: () =>
      import('./features/schedules/add-schedule/add-schedule.component').then(
        (m) => m.AddScheduleComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: 'today', pathMatch: 'full' },
  { path: '**', redirectTo: 'today' },
];
