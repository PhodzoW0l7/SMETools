import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Supabase } from '../supabase';
import { UserRole } from '../models';

// ── Guard: must be logged in ──────────────────────────────────
export const authGuard: CanActivateFn = async () => {
  const supabase = inject(Supabase);
  const router   = inject(Router);

  const { data: { session } } = await supabase.client.auth.getSession();

  if (session) return true;

  router.navigate(['/auth/login']);
  return false;
};

// ── Guard: redirect logged-in users away from /auth/* ─────────
// Reads role from DB to redirect admin/manager to dashboard
// instead of always going to inbox
export const publicOnlyGuard: CanActivateFn = async () => {
  const supabase = inject(Supabase);
  const router   = inject(Router);

  const { data: { session } } = await supabase.client.auth.getSession();

  // Not logged in — allow access to login/register
  if (!session) return true;

  // Logged in — redirect based on role
  const { data: profile } = await supabase.client
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = (profile as any)?.role;

  switch (role) {
    case 'super_admin':
      router.navigate(['/super-admin']);
      break;
    case 'admin':
    case 'manager':
      router.navigate(['/dashboard']);
      break;
    default:
      router.navigate(['/inbox']);
  }

  return false;
};

// ── Guard: must have one of the allowed roles ─────────────────
// Reads role directly from DB — not from the signal
// so it works even before loadSession() has completed
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return async () => {
    const supabase = inject(Supabase);
    const router   = inject(Router);

    const { data: { session } } = await supabase.client.auth.getSession();
    if (!session) {
      router.navigate(['/auth/login']);
      return false;
    }

    const { data: profile } = await supabase.client
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = (profile as any)?.role;
    console.log('[Guard] roleGuard — role:', role, 'allowed:', allowedRoles);

    if (role && allowedRoles.includes(role as UserRole)) return true;

    // Role not permitted — send to their default page
    switch (role) {
      case 'super_admin':
        router.navigate(['/super-admin']);
        break;
      case 'admin':
      case 'manager':
        router.navigate(['/dashboard']);
        break;
      default:
        router.navigate(['/inbox']);
    }

    return false;
  };
};