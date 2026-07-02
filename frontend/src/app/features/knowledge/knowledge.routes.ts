import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-knowledge-placeholder',
  standalone: true,
  template: `
    <div style="padding: 2.5rem; max-width: 1200px; margin: 0 auto;">
      <h1 style="font-size: 24px; font-weight: 500; margin-bottom: 8px;">Knowledge Base</h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">Documentation articles and help guides will appear here.</p>
    </div>
  `
})
export class KnowledgeComponent {}

export const KNOWLEDGE_ROUTES: Routes = [
  { path: '', component: KnowledgeComponent }
];
