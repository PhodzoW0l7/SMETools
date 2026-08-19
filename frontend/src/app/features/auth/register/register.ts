import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  // ── These imports were missing — form and router directives need them ──
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  form:         FormGroup;
  loading      = signal(false);
  submitted    = signal(false);
  errorMessage = signal('');

  constructor(
    private fb:     FormBuilder,
    private auth:   AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        org_name:         ['', Validators.required],
        org_slug:         ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
        full_name:        ['', Validators.required],
        email:            ['', [Validators.required, Validators.email]],
        password:         ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // Auto-generate slug from org name on blur
  autoFillSlug(): void {
    const name = this.form.value.org_name ?? '';
    if (!this.form.value.org_slug && name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      this.form.patchValue({ org_slug: slug });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    // try {
    //   await this.auth.registerOrganisation({
    //     org_name:  this.form.value.org_name,
    //     org_slug:  this.form.value.org_slug,
    //     full_name: this.form.value.full_name,
    //     email:     this.form.value.email,
    //     password:  this.form.value.password,
    //   });
    //   this.submitted.set(true);
    // } catch (err: any) {
    //   this.errorMessage.set(err.message ?? 'Registration failed. Please try again.');
    // } finally {
    //   this.loading.set(false);
    // }
  }

  private passwordMatchValidator(group: AbstractControl) {
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirm_password')?.value;
    return pw === cpw ? null : { passwordMismatch: true };
  }
}