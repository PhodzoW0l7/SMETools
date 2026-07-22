// ============================================================
// register.component.ts
// Creates a new organisation and the first admin user.
// Flow: insert organisation row → signUp with metadata →
//       handle_new_user() trigger creates public.users row.
// ============================================================

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-card">

        @if (!submitted()) {
          <div style="margin-bottom: 1.5rem; text-align: center;">
      <img 
        src="logo.png" 
        alt="Logo" 
        style="height: 200px; width: auto; display: inline-block;" 
      />
    </div>
          <h1>Register your organisation</h1>
          <p class="subtitle">Set up your workspace in under a minute</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">

            <p class="section-label">Your organisation</p>

            <div class="field">
              <label>Company name</label>
              <input type="text" formControlName="org_name"
                     placeholder="Acme Corp"
                     (blur)="autoFillSlug()" />
            </div>

            <div class="field">
              <label>Workspace URL</label>
              <div class="input-prefix">
                <span>supportdesk.io/</span>
                <input type="text" formControlName="org_slug" placeholder="acme-corp" />
              </div>
              @if (form.get('org_slug')?.errors?.['pattern']) {
                <span class="error">Lowercase letters, numbers and hyphens only</span>
              }
            </div>

            <p class="section-label">Your account</p>

            <div class="field">
              <label>Full name</label>
              <input type="text" formControlName="full_name" placeholder="Jane Smith" />
            </div>

            <div class="field">
              <label>Work email</label>
              <input type="email" formControlName="email" placeholder="jane@acme.com" />
            </div>

            <div class="field">
              <label>Password</label>
              <input type="password" formControlName="password" placeholder="At least 8 characters" />
            </div>

            <div class="field">
              <label>Confirm password</label>
              <input type="password" formControlName="confirm_password" placeholder="••••••••" />
              @if (form.errors?.['passwordMismatch'] && form.get('confirm_password')?.touched) {
                <span class="error">Passwords do not match</span>
              }
            </div>

            @if (errorMessage()) {
              <p class="error-banner">{{ errorMessage() }}</p>
            }

            <button type="submit" class="btn-primary" [disabled]="loading()">
              {{ loading() ? 'Creating workspace…' : 'Create workspace' }}
            </button>

          </form>

          <p class="switch-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </p>
        }

        @if (submitted()) {
          <div class="success-state">
            <div class="success-icon">✓</div>
            <h2>Check your email</h2>
            <p>We've sent a confirmation link to <strong>{{ form.value.email }}</strong>. Click it to activate your account and get started.</p>
            <a routerLink="/auth/login" class="btn-primary" style="display:block;text-align:center;text-decoration:none">Back to login</a>
          </div>
        }

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
      max-width: 440px;
    }
    h1 { font-size: 22px; font-weight: 500; margin: 0 0 4px; }
    h2 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 1.5rem; }
    .section-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-text-tertiary);
      margin: 1.25rem 0 .75rem;
    }
    .field { margin-bottom: 1rem; }
    .field label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; }
    .field input { width: 100%; box-sizing: border-box; }
    .input-prefix {
      display: flex;
      align-items: center;
      border: 0.5px solid var(--color-border-secondary);
      border-radius: var(--border-radius-md);
      overflow: hidden;
    }
    .input-prefix span {
      padding: 0 10px;
      font-size: 12px;
      color: var(--color-text-tertiary);
      background: var(--color-background-secondary);
      border-right: 0.5px solid var(--color-border-tertiary);
      white-space: nowrap;
      height: 36px;
      display: flex;
      align-items: center;
    }
    .input-prefix input { border: none; border-radius: 0; flex: 1; }
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
      margin-top: 0.5rem;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .switch-link { font-size: 12px; color: var(--color-text-tertiary); text-align: center; margin: 1rem 0 0; }
    .switch-link a { color: var(--color-text-info); text-decoration: none; }
    .success-state { text-align: center; padding: 1rem 0; }
    .success-icon {
      width: 48px; height: 48px;
      background: var(--color-background-success);
      color: var(--color-text-success);
      border-radius: 50%;
      font-size: 22px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
    }
    .success-state p { font-size: 14px; color: var(--color-text-secondary); margin: 0 0 1.5rem; line-height: 1.6; }
  `]
})
export class RegisterComponent {

  form: FormGroup;
  loading      = signal(false);
  submitted    = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        org_name:        ['', Validators.required],
        org_slug:        ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
        full_name:       ['', Validators.required],
        email:           ['', [Validators.required, Validators.email]],
        password:        ['', [Validators.required, Validators.minLength(8)]],
        confirm_password:['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // Auto-generate slug from org name
  autoFillSlug(): void {
    const name = this.form.value.org_name ?? '';
    if (!this.form.value.org_slug && name) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      this.form.patchValue({ org_slug: slug });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.registerOrganisation({
        org_name:  this.form.value.org_name,
        org_slug:  this.form.value.org_slug,
        full_name: this.form.value.full_name,
        email:     this.form.value.email,
        password:  this.form.value.password,
      });
      this.submitted.set(true);
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Registration failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private passwordMatchValidator(group: AbstractControl) {
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirm_password')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  }
}