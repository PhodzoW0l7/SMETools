import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service'; // Adjust relative path to service
import { UserRole } from '../models/index';             // Points cleanly to your index barrel

/**
 * 1. Master Security Guard: Blocks unauthenticated users.
 * Uses a small micro-delay fallback to give Supabase time to restore the local session.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If signal is instantly true, allow passage immediately
  if (auth.isLoggedIn()) return true;

  // Small asynchronous pause to wait for restoreSession() to complete on page refresh
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Double check after the session restore window
  if (auth.isLoggedIn()) return true;

  // Not logged in — redirect to credentials gateway
  router.navigate(['/auth/login']);
  return false;
};

/**
 * 2. Reverse Public Guard: Redirects logged-in users AWAY from login/register screens.
 */
export const publicOnlyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Small asynchronous pause to let the refresh state settle
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Not logged in — allow access to public auth panels freely
  if (!auth.isLoggedIn()) return true;

  // Logged in — actively bounce them back to their workspace domain
  const role = auth.role();
  if (role === 'super_admin') { router.navigate(['/super-admin']); }
  else if (auth.isAdmin()) { router.navigate(['/dashboard']); }
  else { router.navigate(['/inbox']); }
  
  return false;
};

/**
 * 3. Granular Role Guard: Inspects specific role clearings.
 * Reads allowed roles directly from the Angular Route Data Matrix definition block.
 */
export const roleGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Synchronize refresh states
  if (!auth.isLoggedIn()) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Final confirmation check
  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Retrieve allowed roles array directly out of the route configuration metadata definitions
  const allowedRoles = route.data['roles'] as UserRole[];
  const userRole = auth.role();

  if (userRole && allowedRoles.includes(userRole)) return true;

  // Role lacks clearance — send them back to their safe default workspace zone
  if (userRole === 'super_admin') { router.navigate(['/super-admin']); }
  else if (auth.isAdmin()) { router.navigate(['/dashboard']); }
  else { router.navigate(['/inbox']); }

  return false;
};
