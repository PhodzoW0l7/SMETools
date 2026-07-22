import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Default redirect — authGuard will bounce unauthenticated to login
  { path: '', redirectTo: 'inbox', pathMatch: 'full' },

  // ── Public Auth Routes ──
  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // ── Protected Shell (sidebar + topbar + main content) ──
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/shell/shell').then(m => m.ShellPage),
    children: [
      {
        path: 'inbox',
        loadComponent: () =>
          import('./features/inbox/inbox').then(m => m.InboxPage),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets').then(m => m.TicketsPage),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./features/ticket-detail/ticket-detail').then(m => m.TicketDetailPage),
      },
      {
        path: 'knowledge',
        loadComponent: () =>
          import('./features/knowledge/knowledge').then(m => m.KnowledgePage),
      },
      {
        path: 'dashboard',
        canActivate: [roleGuard(['admin', 'super_admin'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'team',
        canActivate: [roleGuard(['admin', 'super_admin'])],
        loadComponent: () =>
          import('./features/team/team').then(m => m.TeamPage),
      },
      {
        path: 'settings',
        canActivate: [roleGuard(['admin', 'super_admin'])],
        loadComponent: () =>
          import('./features/settings/settings').then(m => m.SettingsPage),
      },
      {
        path: 'super-admin',
        canActivate: [roleGuard(['super_admin'])],
        loadComponent: () =>
          import('./features/super-admin/super-admin').then(m => m.SuperAdminPage),
      },
    ],
  },

  // Catch-all
  { path: '**', redirectTo: 'inbox' },
];