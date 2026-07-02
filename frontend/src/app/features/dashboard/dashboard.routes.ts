import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  template: `
    <div style="padding: 2.5rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 8px;">Analytics Dashboard</h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">Operational metrics, performance charts, and reports will appear here.</p>
    </div>
  `
})
export class DashboardComponent {}

export const DASHBOARD_ROUTES: Routes = [
  { path: '', component: DashboardComponent }
];
