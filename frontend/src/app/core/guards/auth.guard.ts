import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../shared/models/index';

// ── Guard: Require Authentication ────────────────────────────
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login']);
};

// ── Guard: Require Specific Roles ────────────────────────────
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (): boolean | UrlTree => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    // If not logged in at all, send to login instead of inbox
    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/auth/login']);
    }

    const role = auth.role();
    if (role && allowedRoles.includes(role as UserRole)) {
      return true;
    }

    return router.createUrlTree(['/inbox']);
  };
};

// ── Guard: Prevent Authenticated Users from Public Routes ────
export const publicOnlyGuard: CanActivateFn = (): boolean | UrlTree => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return !auth.isLoggedIn() ? true : router.createUrlTree(['/inbox']);
};
