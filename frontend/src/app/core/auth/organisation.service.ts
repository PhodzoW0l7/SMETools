import { Injectable, inject } from '@angular/core';
import { Supabase } from '../supabase'; 

export interface CreateOrganisationDto {
  organisationName: string;
  workspaceSlug: string;
  managerName: string;
  managerEmail: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganisationService {

  private supabase = inject(Supabase);

  async createOrganisation(dto: CreateOrganisationDto) {

    const { data, error } = await this.supabase.client.rpc(
      'create_organisation_and_invite_manager',
      {
        organisation_name: dto.organisationName,
        organisation_slug: dto.workspaceSlug,
        manager_name: dto.managerName,
        manager_email: dto.managerEmail,
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getOrganisations() {

    const { data, error } = await this.supabase.client
      .from('organisations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

}