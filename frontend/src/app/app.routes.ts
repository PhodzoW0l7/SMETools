import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

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
      import('./features/tickets/tickets.routes').then(m => m.TICKET_ROUTES),
  },
  {
    path: 'knowledge',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/knowledge/knowledge.routes').then(m => m.KNOWLEDGE_ROUTES),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['manager', 'admin', 'super_admin'])],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },

  {
    path: 'settings',
    canActivate: [authGuard, roleGuard(['admin', 'super_admin'])],
    loadChildren: () =>
      import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
  },

  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard(['super_admin'])],
    loadChildren: () =>
      import('./features/super-admin/super-admin.routes').then(m => m.SUPER_ADMIN_ROUTES),
  },

  { path: '**', redirectTo: 'auth/login' },
];