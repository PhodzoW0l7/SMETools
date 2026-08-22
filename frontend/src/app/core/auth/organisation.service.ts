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

  console.log('Organisations query:', data, error);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

  async getManagerCount():Promise<number>{
    const {count,error}=await this.supabase.client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'manager');

    if(error) throw new Error(error.message);
    return count ??0;
  }

  async getAgentCount(): Promise<number> {
  const { count, error } = await this.supabase.client
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'agent');

  if (error) throw new Error(error.message);

  return count ?? 0;
}

  async getPendingInviteCount():Promise<number>{
    const {count,error}=await this.supabase.client
    .from('organisation_invites')
    .select('*', { count: 'exact', head: true })
    .eq('accepted', false);

  if (error) throw new Error(error.message);

  return count ?? 0;
  }

  async getOrganisationById(id: string) {

  const { data, error } = await this.supabase.client
    .from('organisations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async getOrganisationInvite(organisationId: string) {

  const { data, error } = await this.supabase.client
    .from('organisation_invites')
    .select('*')
    .eq('organisation_id', organisationId)
    .eq('role', 'manager')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


async getOrganisationUsers(organisationId: string) {

  const { data, error } = await this.supabase.client
    .from('users')
    .select('id, full_name, role, org_id, avatar_url, created_at')
    .eq('org_id', organisationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

}