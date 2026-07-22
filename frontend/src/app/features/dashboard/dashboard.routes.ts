import { Component, inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div style="padding: 2.5rem; max-width: 1200px; margin: 0 auto;">

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 0.5px solid var(--color-border-tertiary)">
        <div>
          <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 4px;">Dashboard</h1>
          <p style="color: var(--color-text-secondary); font-size: 13px;">
            Logged in as <strong>{{ auth.user()?.email }}</strong>
            · Role: <strong>{{ auth.user()?.role }}</strong>
            · Org: <strong>{{ auth.org()?.name }}</strong>
          </p>
        </div>
        <button (click)="logout()" style="
          height: 36px;
          padding: 0 16px;
          background: var(--color-background-danger);
          color: var(--color-text-danger);
          border: 0.5px solid var(--color-border-danger);
          border-radius: var(--border-radius-md);
          font-size: 13px;
          cursor: pointer;
        ">
          Sign out
        </button>
      </div>

      <p style="color: var(--color-text-secondary); font-size: 14px;">
        ✓ Auth working. Role-based routing working. Dashboard feature coming next.
      </p>

    </div>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);

  async logout() {
    await this.auth.logout();
  }
}

export const DASHBOARD_ROUTES: Routes = [
  { path: '', component: DashboardComponent }
];