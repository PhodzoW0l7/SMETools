import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrganisationService } from '../../../core/auth/organisation.service';
import { CreateOrganisations } from '../create-organisations/create-organisations';

@Component({
  selector: 'app-super-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CreateOrganisations],
  templateUrl: './super-dashboard.html',
  styleUrl: './super-dashboard.css',
})
export class SuperDashboard implements OnInit {
  private organisationService = inject(OrganisationService);

  // Dashboard Data Signals
  organisations = signal<any[]>([]);
  managerCount = signal(0);
  agentCount = signal(0);
  pendingInviteCount = signal(0);

  // UI State Signals
  loading = signal(false);
  errorMessage = signal('');
  showCreateOrganisation = signal(false);

  // CLEANUP: Call the centralized data loading function on initialization
  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  // Centralized function to open the creation overlay
  openCreateOrganisation(): void {
    this.showCreateOrganisation.set(true);
  }

  // Centralized function to close the creation overlay
  closeCreateOrganisation(): void {
    this.showCreateOrganisation.set(false);
  }

  // REFACTOR: Centralized data fetching with error handling for initial load and refreshes
  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(''); // Clear errors before fetching new data

    try {
      const [organisations, managers, agents, pendingInvites] = await Promise.all([
        this.organisationService.getOrganisations(),
        this.organisationService.getManagerCount(),
        this.organisationService.getAgentCount(),
        this.organisationService.getPendingInviteCount()
      ]);

      this.organisations.set(organisations ?? []);
      this.managerCount.set(managers);
      this.agentCount.set(agents);
      this.pendingInviteCount.set(pendingInvites);
    } catch (err: any) {
      this.errorMessage.set(
        err?.message ?? 'Unable to load dashboard data.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  // Automatically fires and refreshes the summary stats when a new organization is created
  async handleOrganisationCreated(): Promise<void> {
    this.closeCreateOrganisation(); // Proactively close the modal on success
    await this.loadDashboard();
  }
}
