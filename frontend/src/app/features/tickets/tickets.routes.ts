// ============================================================
// tickets.routes.ts
// Placeholder implementation to satisfy the Angular compiler
// until the true Tickets feature is built.
// ============================================================

import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-tickets-placeholder',
  standalone: true,
  template: `
    <div style="padding: 2.5rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 8px;">Tickets Dashboard</h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">
        This feature is under development. Ticket tracking pipelines will appear here.
      </p>
    </div>
  `
})
export class TicketsComponent {}

export const TICKET_ROUTES: Routes = [
  {
    path: '',
    component: TicketsComponent
  }
];
