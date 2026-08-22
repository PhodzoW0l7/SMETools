import { Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './accept-invite.html',
  styleUrl: './accept-invite.css',
})
export class AcceptInvite implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  token = '';

  invite = signal<any | null>(null);

  loading = signal(true);
  submitting = signal(false);
  success = signal(false);

  errorMessage = signal('');

  form = this.fb.group({
    fullName: ['', Validators.required],

    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    if (!this.token) {
      this.errorMessage.set('Invalid invitation link.');
      this.loading.set(false);
      return;
    }

    try {
      const invite = await this.auth.getInvitation(this.token);

      if (invite.accepted) {
        throw new Error('This invitation has already been accepted.');
      }

      if (new Date(invite.expires_at) < new Date()) {
        throw new Error('This invitation has expired.');
      }

      this.invite.set(invite);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Unable to load invitation.');
    } finally {
      this.loading.set(false);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.acceptInvitation(
        this.token,
        this.form.value.fullName!,
        this.form.value.password!,
      );

      this.success.set(true);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Unable to create account.');
    } finally {
      this.submitting.set(false);
    }
  }
}
