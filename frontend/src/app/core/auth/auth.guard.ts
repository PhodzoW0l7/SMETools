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

  if (!auth.isLoggedIn()) return true;

  // If already logged in, send them to their designated homepage lane
  const role = auth.role();
  if (role === 'super_admin') await router.navigate(['/super-admin']);
  else if (auth.isAdmin()) await router.navigate(['/dashboard']);
  else await router.navigate(['/inbox']);

  return false;
};

/**
 * 3. Role Guard: Validates explicit permissions without forcing redirect loops
 */
export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.isReady;

  // Safety fallback check
  if (!auth.isLoggedIn()) {
    await router.navigate(['/auth/login']);
    return false;
  }

  const allowedRoles = (route.data['roles'] as UserRole[]) || [];
  const userRole = auth.role();

  // FIX: If the user's role is in the allowed list, allow them through immediately!
  if (userRole && allowedRoles.includes(userRole)) return true;

  // If they lack clearance for THIS specific sub-page, gently send them to their home base
  if (userRole === 'super_admin') await router.navigate(['/super-admin']);
  else if (auth.isAdmin()) await router.navigate(['/dashboard']);
  else await router.navigate(['/inbox']);

  return false;
};
