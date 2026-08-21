import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form: FormGroup;
  loading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading.set(true);
  this.errorMessage.set('');

  try {
    await this.auth.login(
      this.form.value.email,
      this.form.value.password
    );

    await this.router.navigateByUrl(
      this.auth.getHomeRoute()
    );

  } catch (err: any) {
    this.errorMessage.set(
      err.message ??
      'Authentication rejected. Please check your credentials.'
    );
  } finally {
    this.loading.set(false);
  }
  console.log('Logged in user:', this.auth.user());
  console.log('Detected role:', this.auth.role());
  console.log('Home route:', this.auth.getHomeRoute());
}


  // ── FIXED: Google Login Method matching template binding ──
  async loginWithGoogle(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set('');
      await this.auth.loginWithProvider('google');
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Google Sign-In failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
