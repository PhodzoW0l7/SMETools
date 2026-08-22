import { Injectable, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../supabase'; 
import { AuthSession, UserRole, RegisterOrgDto } from '../models/index';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(Supabase);
  private router = inject(Router);

  private _session = signal<AuthSession | null>(null);

  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly org = computed(() => this._session()?.organisation ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly role = computed(() => this._session()?.user?.role ?? null);

  readonly isAdmin = computed(() => ['admin', 'super_admin'].includes(this.role() ?? ''));
  readonly isSuperAdmin = computed(() => this.role() === 'super_admin');

  private resolveReady!: () => void;
  readonly isReady: Promise<void> = new Promise((resolve) => {
    this.resolveReady = resolve;
  });

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    // Await the new async profile mapping
    await this.mapAndSetSession(session);

    // Track state changes asynchronously
    this.supabase.client.auth.onAuthStateChange(async (event, currentSession) => {
      await this.mapAndSetSession(currentSession);
    });

    this.resolveReady();
  }

  private async mapAndSetSession(supabaseSession: any): Promise<void> {
    if (!supabaseSession?.user) {
      this._session.set(null);
      return;
    }

    const authUser = supabaseSession.user;

    // Fetch the updated profile details directly from your public schema
    const { data: dbUser, error } = await this.supabase.client
      .from('users')
      .select('id, full_name, role, org_id, created_at, updated_at')
      .eq('id', authUser.id)
      .single();

    if (error || !dbUser) {
      console.error('Could not load user profile:', error);
      this._session.set(null);
      return;
    }

    this._session.set({
      user: {
        id: dbUser.id,
        email: authUser.email ?? '',
        full_name: dbUser.full_name,
        role: dbUser.role as UserRole,
        org_id: dbUser.org_id ?? '',
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at
      },

      organisation: dbUser.org_id
        ? ({ id: dbUser.org_id } as any)
        : null
    });
  }

  getHomeRoute(): string {
  const role = this.role();

  if (role === 'super_admin') {
    return '/super-admin/dashboard';
  }

  if (role === 'admin' || role === 'manager') {
    return '/dashboard';
  }

  return '/inbox';
}
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    if (data?.session) {
      // Map user asynchronously post-login
      await this.mapAndSetSession(data.session);
    }
  }

  async loginWithProvider(provider: 'google'): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw new Error(error.message);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw new Error(error.message);
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._session.set(null);
    this.router.navigate(['/auth/login']);
  }

  async getInvitation(token: string): Promise<any> {

  const { data, error } = await this.supabase.client.rpc(
    'get_invite_by_token',
    {
      invite_token: token
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    throw new Error('Invitation not found.');
  }

  return data[0];
}


async acceptInvitation(
  token: string,
  fullName: string,
  password: string
): Promise<void> {

  const invite = await this.getInvitation(token);

  if (invite.accepted) {
    throw new Error('This invitation has already been accepted.');
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new Error('This invitation has expired.');
  }

  const { error } = await this.supabase.client.auth.signUp({
    email: invite.email,
    password,

    options: {
      data: {
        full_name: fullName,

        // Important:
        // no role and no org_id sent from Angular.
        invite_token: token
      },

      emailRedirectTo:
        `${window.location.origin}/auth/login`
    }
  });

  if (error) {
    throw new Error(error.message);
  }
}
}
