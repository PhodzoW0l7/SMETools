// ============================================================
// app.routes.ts
// Root routing architecture with lazy-loaded feature modules.
// Protected by functional authGuard and roleGuard systems.
// ============================================================

import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inbox', pathMatch: 'full' },
 
  // ── Public routes (redirect away if already logged in) ──
  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
 
  // ── Protected: all logged-in roles ──────────────────────
  {
    path: 'inbox',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/inbox/inbox.routes').then(m => m.INBOX_ROUTES),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/tickets/tickets.routes').then(m => m.TICKET_ROUTES || (m as any).TICKETS_ROUTES),
  },
  {
    path: 'knowledge',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/knowledge/knowledge.routes').then(m => m.KNOWLEDGE_ROUTES),
  },
 
  // ── Protected: manager and above ────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['manager', 'admin', 'super_admin'])],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
 
  // ── Protected: admin and above ───────────────────────────
  {
    path: 'settings',
    canActivate: [authGuard, roleGuard(['admin', 'super_admin'])],
    loadChildren: () =>
      import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
  },
 
  // ── Super admin only ─────────────────────────────────────
  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard(['super_admin'])],
    loadChildren: () =>
      import('./features/super-admin/super-admin.routes').then(m => m.SUPER_ADMIN_ROUTES),
  },
 
  // Catch-all
  { path: '**', redirectTo: 'inbox' },
];
