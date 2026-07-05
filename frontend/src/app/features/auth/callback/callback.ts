// callback.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../../../core/supabase';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-background-tertiary)">
      <p style="font-size:14px;color:var(--color-text-secondary)">Completing sign in…</p>
    </div>
  `
})
export class CallbackComponent implements OnInit, OnDestroy {
  private supabase = inject(Supabase);
  private router = inject(Router);
  private authSubscription?: { unsubscribe: () => void };

  async ngOnInit(): Promise<void> {
    // Check for error in URL (e.g., OAuth denied)
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      this.router.navigate(['/auth/login'], { queryParams: { error: errorDescription || error } });
      return;
    }

    // Check if session already exists (e.g., after email confirmation)
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) {
      this.router.navigate(['/inbox']);
      return;
    }

    // Listen for the session to arrive after the OAuth callback
    const { data } = this.supabase.client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        this.router.navigate(['/inbox']);
      }
    });
    this.authSubscription = data.subscription;
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }
}