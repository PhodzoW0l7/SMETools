import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Default Application Landing Entry Vector
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Public Auth Channels (Locked down with publicOnlyGuard) ──
  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // ── Protected Application Shell (Houses Sidebar + Header Frame) ──
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/shell/shell').then(m => m.shell),
    children: [
      // Standard Agent Core Operational Work Pools
      {
        path: 'inbox',
        loadComponent: () =>
          import('./features/inbox/inbox').then(m => m.Inbox),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets').then(m => m.Tickets),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./features/tickets/ticket-detail/ticket-detail').then(m => m.TicketDetail),
      },
      {
        path: 'knowledge',
        loadComponent: () =>
          import('./features/knowledge/knowledge').then(m => m.Knowledge),
      },

      // Administrative Management Channels (Using Clean Route Metadata Matrix)
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'team',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
        loadComponent: () =>
          import('./features/teams/teams').then(m => m.Teams),
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'super_admin'] },
        loadComponent: () =>
          import('./features/settings/settings').then(m => m.Settings),
      },
    ],
  },

  // Wildcard Global Routing Catch-All Out-Bounds Backstop
  { path: '**', redirectTo: 'dashboard' },
];
