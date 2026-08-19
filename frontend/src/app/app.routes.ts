import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/auth/auth.guard';

export const routes: Routes = [

  {
    path: 'auth',
    canActivate: [publicOnlyGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES),
  },

  // SUPER ADMIN
  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin'] },

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/super-admin/super-dashboard/super-dashboard')
            .then(m => m.SuperDashboard),
      },

      {
        path: 'create-organisation',
        loadComponent: () =>
          import('./features/super-admin/create-organisations/create-organisations')
            .then(m => m.CreateOrganisations),
      },

      {
        path: 'organisations',
        loadComponent: () =>
          import('./features/super-admin/organisation-list/organisation-list')
            .then(m => m.OrganisationList),
      }
    ],
  },

  // NORMAL APPLICATION
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/shell/shell')
        .then(m => m.shell),

    children: [

      {
        path: 'inbox',
        loadComponent: () =>
          import('./features/inbox/inbox')
            .then(m => m.Inbox),
      },

      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets')
            .then(m => m.Tickets),
      },

      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then(m => m.Dashboard),
      }
    ]
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
