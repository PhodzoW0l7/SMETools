import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Supabase } from '../supabase';
import { UserRole } from '../../shared/models';

export const authGuard: CanActivateFn = async () => {
  const auth     = inject(AuthService);
  const supabase = inject(Supabase);
  const router   = inject(Router);

  // Check the actual Supabase session — not just the signal
  // The signal may not be set yet on first load
  const { data: { session } } = await supabase.client.auth.getSession();

  if (session) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const publicOnlyGuard: CanActivateFn = async () => {
  const supabase = inject(Supabase);
  const router   = inject(Router);

  const { data: { session } } = await supabase.client.auth.getSession();

  if (!session) return true;

  router.navigate(['/inbox']);
  return false;
};

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return async () => {
    const auth     = inject(AuthService);
    const supabase = inject(Supabase);
    const router   = inject(Router);

    const { data: { session } } = await supabase.client.auth.getSession();
    if (!session) { router.navigate(['/auth/login']); return false; }

    const role = auth.role();
    if (role && allowedRoles.includes(role as UserRole)) return true;

    router.navigate(['/inbox']);
    return false;
  };
};