import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/index';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.isReady; 

  if (auth.isLoggedIn()) return true;

  // Not logged in -> redirect to login panel
  await router.navigate(['/auth/login']);
  return false;
};

export const publicOnlyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.isReady;

  if (!auth.isLoggedIn()) {
    return true;
  }

  return router.parseUrl(
    auth.getHomeRoute()
  );
};


export const roleGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot
) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.isReady;

  if (!auth.isLoggedIn()) {
    return router.parseUrl('/auth/login');
  }

  const allowedRoles =
    (route.data['roles'] as UserRole[]) || [];

  const userRole = auth.role();

  if (
    userRole &&
    allowedRoles.includes(userRole)
  ) {
    return true;
  }

  return router.parseUrl(
    auth.getHomeRoute()
  );
};