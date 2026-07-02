// ============================================================
// super-admin.routes.ts
// Placeholder implementation to satisfy the Angular compiler
// until the true Super Admin feature is built.
// ============================================================

import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-super-admin-placeholder',
  standalone: true,
  template: `
    <div style="padding: 2.5rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 8px; color: var(--color-text-danger, #dc2626);">Super Admin Console</h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">
        This restricted area is under development. Global platform administration controls will appear here.
      </p>
    </div>
  `
})
export class SuperAdminComponent {}

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: SuperAdminComponent
  }
];
