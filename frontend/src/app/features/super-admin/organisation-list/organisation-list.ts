import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateOrganisations } from '../create-organisations/create-organisations';
import { OrganisationService } from '../../../core/auth/organisation.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-organisation-list',
  standalone: true,
  imports: [
    CommonModule,
    CreateOrganisations,RouterLink
],
  templateUrl: './organisation-list.html',
  styleUrl: './organisation-list.css',
})
export class OrganisationList implements OnInit {

  private organisationService = inject(OrganisationService);

  organisations = signal<any[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  showCreateOrganisation = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadOrganisations();
  }

  async loadOrganisations(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const data =
        await this.organisationService.getOrganisations();

      this.organisations.set(data ?? []);

    } catch (err: any) {
      this.errorMessage.set(
        err?.message ?? 'Unable to load organisations.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  openCreateOrganisation(): void {
    this.showCreateOrganisation.set(true);
  }

  closeCreateOrganisation(): void {
    this.showCreateOrganisation.set(false);
  }

  async handleOrganisationCreated(): Promise<void> {
    await this.loadOrganisations();
  }
}