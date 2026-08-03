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
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    
  `,
  styles: [`
    
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