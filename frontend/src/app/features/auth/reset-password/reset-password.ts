// ============================================================
// reset-password.component.ts
// Step 1: user enters email → receives magic link
// Step 2: user clicks link → lands here → sets new password
// ============================================================

import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Supabase } from '../../../core/supabase';
import { AuthChangeEvent } from '@supabase/supabase-js';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-card">

        <!-- Step 1: request reset link -->
        @if (!isResetting() && !sent()) {
          <h1>Reset your password</h1>
          <p class="subtitle">Enter your email and we'll send you a reset link</p>

          <form [formGroup]="requestForm" (ngSubmit)="requestReset()">
            <div class="field">
              <label>Email address</label>
              <input type="email" formControlName="email" placeholder="you@company.com" />
            </div>
            @if (errorMessage()) {
              <p class="error-banner">{{ errorMessage() }}</p>
            }
            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Sending…' : 'Send reset link' }}
            </button>
          </form>
          <p class="switch-link"><a routerLink="/auth/login">Back to login</a></p>
        }

        <!-- Sent confirmation -->
        @if (sent()) {
          <div class="success-state">
            <div class="success-icon">✉</div>
            <h2>Check your inbox</h2>
            <p>A password reset link has been sent. It expires in 1 hour.</p>
            <a routerLink="/auth/login" class="btn-primary" style="display:block;text-align:center;text-decoration:none">Back to login</a>
          </div>
        }

        <!-- Step 2: set new password (after clicking email link) -->
        @if (isResetting()) {
          <h1>Set new password</h1>
          <p class="subtitle">Choose a strong password for your account</p>

          <form [formGroup]="newPasswordForm" (ngSubmit)="updatePassword()">
            <div class="field">
              <label>New password</label>
              <input type="password" formControlName="password" placeholder="At least 8 characters" />
            </div>
            <div class="field">
              <label>Confirm new password</label>
              <input type="password" formControlName="confirm_password" placeholder="••••••••" />
            </div>
            @if (errorMessage()) {
              <p class="error-banner">{{ errorMessage() }}</p>
            }
            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Updating…' : 'Update password' }}
            </button>
          </form>
        }

      </div>
    </div>
  `,
  styles: [`
    .auth-layout { min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-background-tertiary);padding:2rem }
    .auth-card { background:var(--color-background-primary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:2.5rem;width:100%;max-width:400px }
    h1 { font-size:22px;font-weight:500;margin:0 0 4px }
    h2 { font-size:18px;font-weight:500;margin:0 0 8px }
    .subtitle { font-size:14px;color:var(--color-text-secondary);margin:0 0 2rem }
    .field { margin-bottom:1rem }
    .field label { display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:6px }
    .field input { width:100%;box-sizing:border-box }
    .error-banner { background:var(--color-background-danger);color:var(--color-text-danger);border-radius:var(--border-radius-md);padding:8px 12px;font-size:13px;margin-bottom:1rem }
    .btn-primary { width:100%;height:38px;background:var(--color-background-info);color:var(--color-text-info);border:none;border-radius:var(--border-radius-md);font-size:13px;font-weight:500;cursor:pointer;margin-top:0.5rem }
    .btn-primary:disabled { opacity:0.6;cursor:not-allowed }
    .switch-link { font-size:12px;color:var(--color-text-tertiary);text-align:center;margin:1rem 0 0 }
    .switch-link a { color:var(--color-text-info);text-decoration:none }
    .success-state { text-align:center;padding:1rem 0 }
    .success-icon { width:48px;height:48px;background:var(--color-background-success);color:var(--color-text-success);border-radius:50%;font-size:22px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem }
    .success-state p { font-size:14px;color:var(--color-text-secondary);margin:0 0 1.5rem;line-height:1.6 }
  `]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private supabase = inject(Supabase);
  private router = inject(Router);

  requestForm!: FormGroup;
  newPasswordForm!: FormGroup;
  
  loading = signal(false);
  sent = signal(false);
  isResetting = signal(false);
  errorMessage = signal('');

  private authSubscription?: any;

  ngOnInit(): void {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.newPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', Validators.required],
    });

    // Detect if user arrived via a password reset link
    const { data } = this.supabase.client.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.isResetting.set(true);
      }
    });

    this.authSubscription = data.subscription;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async requestReset(): Promise<void> {
    if (this.requestForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      await this.auth.requestPasswordReset(this.requestForm.value.email);
      this.sent.set(true);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'An error occurred.');
    } finally {
      this.loading.set(false);
    }
  }

  async updatePassword(): Promise<void> {
    const { password, confirm_password } = this.newPasswordForm.value;
    if (password !== confirm_password) {
      this.errorMessage.set('Passwords do not match');
      return;
    }
    this.loading.set(true);
    try {
      await this.auth.updatePassword(password);
      this.router.navigate(['/inbox']);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Failed to update password.');
    } finally {
      this.loading.set(false);
    }
  }
}