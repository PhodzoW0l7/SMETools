import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-inbox-placeholder',
  standalone: true,
  template: `
    <div style="padding: 2.5rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 8px;">Inbox</h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">Your communications and incoming activity streams will appear here.</p>
    </div>
  `
})
export class InboxComponent {}

export const INBOX_ROUTES: Routes = [
  { path: '', component: InboxComponent }
];
