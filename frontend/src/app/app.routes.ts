import { Routes } from '@angular/router';
import {
  authGuard,
  roleGuard
} from './core/auth/auth.guard';

export const routes: Routes = [

  // =========================================================
  // PUBLIC AUTH ROUTES
  // =========================================================
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes')
        .then(m => m.AUTH_ROUTES),
  },


  // =========================================================
  // PROTECTED APPLICATION SHELL
  // =========================================================
  {
    path: '',
    canActivate: [authGuard],

    loadComponent: () =>
      import('./core/layout/shell/shell')
        .then(m => m.shell),

    children: [

      // =====================================================
      // SUPER ADMIN
      // =====================================================
      {
        path: 'super-admin',

        canActivate: [roleGuard],

        data: {
          roles: ['super_admin']
        },

        children: [

          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },

          {
            path: 'dashboard',
            loadComponent: () =>
              import(
                './features/super-admin/super-dashboard/super-dashboard'
              ).then(m => m.SuperDashboard),
          },

          {
            path: 'organisations',
            loadComponent: () =>
              import(
                './features/super-admin/organisation-list/organisation-list'
              ).then(m => m.OrganisationList),
          },

          {
            path: 'organisations/:id',
            loadComponent: () =>
              import(
                './features/super-admin/organisation-detail/organisation-detail'
              ).then(m => m.OrganisationDetail),
          },

        ],
      },


      // =====================================================
      // NORMAL APPLICATION
      // =====================================================

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
        path: 'tickets/:id',
        loadComponent: () =>
          import(
            './features/tickets/ticket-detail/ticket-detail'
          ).then(m => m.TicketDetail),
      },

      {
        path: 'knowledge',
        loadComponent: () =>
          import('./features/knowledge/knowledge')
            .then(m => m.Knowledge),
      },


      // =====================================================
      // MANAGER / ADMIN
      // =====================================================
      {
        path: 'dashboard',

        canActivate: [roleGuard],

        data: {
          roles: ['admin', 'manager']
        },

        loadComponent: () =>
          import('./features/dashboard/dashboard')
            .then(m => m.Dashboard),
      },

      {
        path: 'team',

        canActivate: [roleGuard],

        data: {
          roles: ['admin', 'manager']
        },

        loadComponent: () =>
          import('./features/teams/teams')
            .then(m => m.Teams),
      },

      {
        path: 'settings',

        canActivate: [roleGuard],

        data: {
          roles: ['admin', 'manager']
        },

        loadComponent: () =>
          import('./features/settings/settings')
            .then(m => m.Settings),
      },

    ],
  },


  // =========================================================
  // ROOT
  // =========================================================
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },


  // =========================================================
  // FALLBACK
  // =========================================================
  {
    path: '**',
    redirectTo: 'auth/login',
  },

];