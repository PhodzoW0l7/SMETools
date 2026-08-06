import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {OrganisationService} from '../../../core/auth/organisation.service';

@Component({
  selector: 'app-super-dashboard',
  imports: [],
  templateUrl: './super-dashboard.html',
  styleUrl: './super-dashboard.css',
})
export class SuperDashboard {
  private organisationService = inject(OrganisationService);

  organisations = signal<any[]>([]);

  async ngOnInit() {
    this.organisations.set(
      await this.organisationService.getOrganisations()
    );
  }

}
