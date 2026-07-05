import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-card">
        <h1>Welcome back</h1>
        <p class="subtitle">Sign in to your workspace</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">

          <div class="field">
            <label>Email address</label>
            <input type="email" formControlName="email" placeholder="you@company.com" />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="error">Enter a valid email address</span>
            }
          </div>

          <div class="field">
            <div class="field-header">
              <label>Password</label>
              <a routerLink="/auth/reset-password">Forgot password?</a>
            </div>
            <input type="password" formControlName="password" placeholder="••••••••" />
          </div>

          @if (errorMessage()) {
            <p class="error-banner">{{ errorMessage() }}</p>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>

        </form>

        <div class="divider"><span>or continue with</span></div>

        <button class="btn-oauth" (click)="loginWithGoogle()">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <p class="switch-link">
          Don't have an account? <a routerLink="/auth/register">Register your organisation</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background-tertiary);
      padding: 2rem;
    }
    .auth-card {
      background: var(--color-background-primary);
      border: 0.5px solid var(--color-border-tertiary);
      border-radius: var(--border-radius-lg);
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
    }
    h1 { font-size: 22px; font-weight: 500; margin: 0 0 4px; }
    .subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 2rem; }
    .field { margin-bottom: 1rem; }
    .field label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; }
    .field input { width: 100%; box-sizing: border-box; }
    .field-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .field-header a { font-size: 12px; color: var(--color-text-info); text-decoration: none; }
    .error { font-size: 11px; color: var(--color-text-danger); margin-top: 4px; display: block; }
    .error-banner {
      background: var(--color-background-danger);
      color: var(--color-text-danger);
      border-radius: var(--border-radius-md);
      padding: 8px 12px;
      font-size: 13px;
      margin-bottom: 1rem;
    }
    .btn-primary {
      width: 100%;
      height: 38px;
      background: var(--color-background-info);
      color: var(--color-text-info);
      border: none;
      border-radius: var(--border-radius-md);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1rem;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .divider { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 0.5px; background: var(--color-border-tertiary); }
    .divider span { font-size: 12px; color: var(--color-text-tertiary); white-space: nowrap; }
    .btn-oauth {
      width: 100%;
      height: 38px;
      border: 0.5px solid var(--color-border-secondary);
      background: transparent;
      border-radius: var(--border-radius-md);
      font-size: 13px;
      color: var(--color-text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 1.5rem;
    }
    .switch-link { font-size: 12px; color: var(--color-text-tertiary); text-align: center; margin: 0; }
    .switch-link a { color: var(--color-text-info); text-decoration: none; }
  `]
})
export class LoginComponent {

  form:         FormGroup;
  loading      = signal(false);
  errorMessage = signal('');

  constructor(
    private fb:   FormBuilder,
    private auth: AuthService
    // ← Router removed — navigation handled inside AuthService.loadSession()
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.login(
        this.form.value.email,
        this.form.value.password
      );
      // No navigation here — AuthService.loadSession() handles it
      // loading stays true until onAuthStateChange fires and page changes
    } catch (err: any) {
      // Only reaches here if signInWithPassword itself fails (wrong password etc)
      this.errorMessage.set(err.message ?? 'Login failed. Please try again.');
      this.loading.set(false);  // Reset only on error — success navigates away
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      await this.auth.loginWithProvider('google');
    } catch (err: any) {
      this.errorMessage.set(err.message);
    }
  }
}