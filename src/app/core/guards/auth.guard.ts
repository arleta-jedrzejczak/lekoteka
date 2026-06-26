import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user as authUser } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const currentUser = await firstValueFrom(authUser(auth));
  return currentUser ? true : router.createUrlTree(['/login']);
};

export const loginGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const currentUser = await firstValueFrom(authUser(auth));
  return currentUser ? router.createUrlTree(['/today']) : true;
};
