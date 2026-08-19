import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormBuilder,ReactiveFormsModule,Validators} from '@angular/forms';
import { Router } from '@angular/router';
import {OrganisationService} from '../../../core/auth/organisation.service';

@Component({
  selector: 'app-create-organisations',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './create-organisations.html',
  styleUrl: './create-organisations.css',
})
export class CreateOrganisations {
    private fb = inject(FormBuilder);
    private router = inject(Router);
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
            [Validators.required, Validators.email]
        ]
    });

    autoFillSlug() {

        const value =
            this.form.value.organisationName ?? '';

        if (!this.form.value.workspaceSlug) {

            this.form.patchValue({

                workspaceSlug: value
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '-')
                    .replace(/-+/g, '-')

            });

        }

    }

    async submit() {

        if (this.form.invalid)
            return;

        this.loading.set(true);

        try {

            await this.organisationService.createOrganisation(
                this.form.getRawValue() as any
            );

            this.success.set(true);

        }
        catch(err:any){

            this.errorMessage.set(err.message);

        }

        finally{

            this.loading.set(false);

        }

    }
}
