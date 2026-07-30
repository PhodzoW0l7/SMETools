import { Routes } from '@angular/router';
 
export const AUTH_ROUTES: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('../../features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('../../features/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../../features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent),
  },
];
 