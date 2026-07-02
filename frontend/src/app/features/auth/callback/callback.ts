// ============================================================
// callback.component.ts
// Landing page for OAuth and email confirmation redirects.
// Supabase exchanges the code for a session automatically —
// we just wait for the auth state change then redirect.
// ============================================================

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../../../core/supabase';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { Subscription } from 'rxjs';

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
  private authSubscription?: any; // Stores the Supabase subscription object

  async ngOnInit(): Promise<void> {
    // Supabase JS handles the token exchange from the URL hash automatically.
    // We check if a session is already established on load.
    const { data: { session } } = await this.supabase.client.auth.getSession();

    if (session) {
      this.router.navigate(['/inbox']);
      return;
    }

    // Listen for the session to arrive after the hash/code exchange completes
    const { data } = this.supabase.client.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        this.router.navigate(['/inbox']);
      }
    });
    
    this.authSubscription = data.subscription;
  }

  ngOnDestroy(): void {
    // Clean up the auth state listener to avoid memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
