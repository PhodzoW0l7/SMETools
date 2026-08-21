import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  OrganisationService
} from '../../../core/auth/organisation.service';

@Component({
  selector: 'app-create-organisations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './create-organisations.html',
  styleUrl: './create-organisations.css',
})
export class CreateOrganisations {

  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private organisationService = inject(OrganisationService);

  loading = signal(false);
  success = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    organisationName: ['', Validators.required],
    workspaceSlug: ['', Validators.required],
    managerName: ['', Validators.required],
    managerEmail: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ]
  });

  autoFillSlug(): void {

    const value =
      this.form.value.organisationName ?? '';

    if (!this.form.value.workspaceSlug) {

      this.form.patchValue({
        workspaceSlug: value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      });

    }
  }

  async submit(): Promise<void> {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {

      await this.organisationService.createOrganisation({
        organisationName:
          this.form.value.organisationName!,

        workspaceSlug:
          this.form.value.workspaceSlug!,

        managerName:
          this.form.value.managerName!,

        managerEmail:
          this.form.value.managerEmail!
      });

      this.success.set(true);

      this.created.emit();

    } catch (err: any) {

      this.errorMessage.set(
        err?.message ??
        'Unable to create organisation.'
      );

    } finally {

      this.loading.set(false);

    }
  }
}