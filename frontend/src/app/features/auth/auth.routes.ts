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
      import('../../features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('../../features/auth/register/register').then(m => m.Register),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../../features/auth/reset-password/reset-password').then(m => m.ResetPassword),
  },
];
 