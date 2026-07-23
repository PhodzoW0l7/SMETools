import { Injectable, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../supabase';
import { AuthChangeEvent } from '@supabase/supabase-js';
import { 
  AuthSession, Organisation, RegisterOrgDto, InviteUserDto, UserRole } from '../models/index';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(Supabase); 
  private router   = inject(Router);

  private _session = signal<AuthSession | null>(null);

  readonly session    = this._session.asReadonly();
  readonly user       = computed(() => this._session()?.user ?? null);
  readonly org        = computed(() => this._session()?.organisation ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly role       = computed(() => this._session()?.user.role ?? null);

  readonly isAdmin      = computed(() => ['admin', 'super_admin'].includes(this.role() ?? ''));
  readonly isSuperAdmin = computed(() => this.role() === 'super_admin');

  constructor() {
    this.listenToAuthChanges();
    // Restore session on app init (no navigation — user is already on their page)
    setTimeout(() => this.restoreSession(), 0);
  }

  // ── Register ──────────────────────────────────────────────
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

  // ── Login ─────────────────────────────────────────────────
  async login(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth
      .signInWithPassword({ email, password });

    if (error) throw new Error(error.message);
    // onAuthStateChange SIGNED_IN will fire → loadSession() → navigate
  }

  // ── OAuth ─────────────────────────────────────────────────
  async loginWithProvider(provider: 'google' | 'azure'): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._session.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Password reset ────────────────────────────────────────
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw new Error(error.message);
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  // ── Invite ────────────────────────────────────────────────
  async inviteUser(dto: InviteUserDto): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke('invite-user', {
      body: {
        email:     dto.email,
        full_name: dto.full_name,
        role:      dto.role,
        org_id:    this.org()?.id,
      },
    });
    if (error) throw new Error(error.message);
  }

  // ── Update role ───────────────────────────────────────────
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.supabase.client
      .from('users')
      .update({ role } as any)
      .eq('id', userId)
      .eq('org_id', this.org()?.id ?? '');
    if (error) throw new Error(error.message);
  }

  // ── Load session + navigate (called on SIGNED_IN only) ────
  private async loadSession(): Promise<void> {
    try {
      const { data: { user: authUser } } = await this.supabase.client.auth.getUser();
      if (!authUser) return;

      const { data: profile, error } = await this.supabase.client
        .from('users')
        .select('*, organisations(*)')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) return;

      const p = profile as any;

      this._session.set({
        user:         { ...p, email: authUser.email },
        organisation: p.organisations,
      });

      // Navigate based on role (only called after explicit login)
      this.navigateByRole(p.role);

    } catch (e) {
      console.error('[Auth] loadSession error:', e);
    }
  }

  // ── Restore session WITHOUT navigation (page refresh) ─────
  private async restoreSession(): Promise<void> {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (!session) return;

    // Just load the session data, don't navigate
    try {
      const { data: { user: authUser } } = await this.supabase.client.auth.getUser();
      if (!authUser) return;

      const { data: profile, error } = await this.supabase.client
        .from('users')
        .select('*, organisations(*)')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) return;

      const p = profile as any;
      this._session.set({
        user:         { ...p, email: authUser.email },
        organisation: p.organisations,
      });
    } catch (e) {
      console.error('[Auth] restoreSession error:', e);
    }
  }

  // ── Auth state listener ───────────────────────────────────
  private listenToAuthChanges(): void {
    this.supabase.client.auth.onAuthStateChange(async (event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        await this.loadSession(); // This navigates
      }
      if (event === 'SIGNED_OUT') {
        this._session.set(null);
      }
      if (event === 'USER_UPDATED') {
        await this.restoreSession(); // Password update, etc. — no nav
      }
    });
  }

  // ── Role-based navigation ─────────────────────────────────
  private navigateByRole(role: string): void {
    switch (role) {
      case 'super_admin':
        this.router.navigate(['/super-admin']);
        break;
      case 'admin':
        this.router.navigate(['/dashboard']);
        break;
      default:
        this.router.navigate(['/inbox']);
    }
  }
}