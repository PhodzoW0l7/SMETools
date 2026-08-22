import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganisationService } from '../../../core/auth/organisation.service';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-organisation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organisation-detail.html',
  styleUrl: './organisation-detail.css',
})
export class OrganisationDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private organisationService = inject(OrganisationService);
  private location = inject(Location);

  organisation = signal<any | null>(null);
  managerInvite = signal<any | null>(null);
  users = signal<any[]>([]);

  manager = computed(() =>
    this.users().find(user => user.role === 'manager') ?? null
  );

  agents = computed(() =>
    this.users().filter(user => user.role === 'agent')
  );

  agentCount = computed(() => this.agents().length);

  // Computed state for invitation to preserve performance
  inviteStatus = computed(() => {
    const invite = this.managerInvite();
    if (!invite) return 'No invitation';
    if (invite.accepted) return 'Accepted';
    
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return 'Expired';
    }
    return 'Pending';
  });

  loading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    // Fire and forget safely without altering the lifecycle signature
    this.loadOrganisation();
  }

  async loadOrganisation(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage.set('Organisation ID is missing.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const [organisation, managerInvite, users] = await Promise.all([
        this.organisationService.getOrganisationById(id),
        this.organisationService.getOrganisationInvite(id),
        this.organisationService.getOrganisationUsers(id)
      ]);

      this.organisation.set(organisation);
      this.managerInvite.set(managerInvite);
      this.users.set(users);
    } catch (err: any) {
      this.errorMessage.set(
        err?.message ?? 'Unable to load organisation.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }
}
