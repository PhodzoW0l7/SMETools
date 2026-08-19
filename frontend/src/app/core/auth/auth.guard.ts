import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/index';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.isReady; // Ensure Supabase session check is complete

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

  const role = auth.role();

  if (role === 'super_admin') {
    return router.parseUrl('/super-admin/dashboard');
  }

  if (role === 'admin' || role === 'manager') {
    return router.parseUrl('/dashboard');
  }

  return router.parseUrl('/inbox');
};

/**
 * 3. Role Guard: Validates explicit permissions without forcing redirect loops
 */
export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.isReady;

  if (!auth.isLoggedIn()) {
    return router.parseUrl('/auth/login');
  }

  const allowedRoles = (route.data['roles'] as UserRole[]) || [];
  const userRole = auth.role();

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  if (userRole === 'super_admin') {
    return router.parseUrl('/super-admin/dashboard');
  }

  if (userRole === 'admin' || userRole === 'manager') {
    return router.parseUrl('/dashboard');
  }

  return router.parseUrl('/inbox');
};
