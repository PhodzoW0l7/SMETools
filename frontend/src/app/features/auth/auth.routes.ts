import { Routes } from '@angular/router';
import { publicOnlyGuard } from '../../core/auth/auth.guard';

export const AUTH_ROUTES: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',

    canActivate: [publicOnlyGuard],

    loadComponent: () =>
      import('./login/login')
        .then(m => m.Login),
  },

  {
    path: 'register',

    canActivate: [publicOnlyGuard],

    loadComponent: () =>
      import('./register/register')
        .then(m => m.Register),
  },

  {
    path: 'reset-password',

    loadComponent: () =>
      import('./reset-password/reset-password')
        .then(m => m.ResetPassword),
  },

  {
    path: 'accept-invite/:token',

    loadComponent: () =>
      import('./accept-invite/accept-invite')
        .then(m => m.AcceptInvite),
  },

];