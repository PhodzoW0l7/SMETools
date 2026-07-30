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
    this.mapAndSetSession(session);

    this.supabase.client.auth.onAuthStateChange((event, currentSession) => {
      this.mapAndSetSession(currentSession);
    });

    this.resolveReady();
  }

  private mapAndSetSession(supabaseSession: any): void {
    if (!supabaseSession?.user) {
      this._session.set(null);
      return;
    }

    const metadata = supabaseSession.user.user_metadata || {};
    const userRole = String(metadata['role'] || 'agent').toLowerCase() as UserRole;

    this._session.set({
      user: {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email ?? '',
        role: userRole,
        full_name: metadata['full_name'] || '',
        org_id: metadata['org_id'] || '',
        created_at: supabaseSession.user.created_at || '',
        updated_at: supabaseSession.user.updated_at || ''
      },
      organisation: metadata['org_id'] ? ({ id: metadata['org_id'] } as any) : null,
    });
  }

  // ── RESTORED: Register Organisation Method ──
  async registerOrganisation(dto: RegisterOrgDto): Promise<void> {
    const { data: org, error: orgError } = await this.supabase.client
      .rpc('create_organisation', {
        org_name: dto.org_name,
        org_slug: dto.org_slug,
      });

    if (orgError) throw new Error(orgError.message);

    const { error: authError } = await this.supabase.client.auth.signUp({
      email:    dto.email,
      password: dto.password,
      options: {
        data: {
          org_id:    (org as any).id,
          full_name: dto.full_name,
          role:      'admin',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) throw new Error(authError.message);
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    if (data?.session) {
      this.mapAndSetSession(data.session);
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

  // ── ADDED: Password Reset Methods for ResetPasswordComponent ──
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
}
