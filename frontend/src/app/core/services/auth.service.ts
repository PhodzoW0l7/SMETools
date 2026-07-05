import { Injectable, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Supabase } from '../supabase';
import { AuthChangeEvent } from '@supabase/supabase-js';
import {
  AuthSession, Organisation, User,
  RegisterOrgDto, InviteUserDto, UserRole
} from '../../shared/models';

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
  readonly isManager    = computed(() => ['manager', 'admin', 'super_admin'].includes(this.role() ?? ''));
  readonly isSuperAdmin = computed(() => this.role() === 'super_admin');

  constructor() {
    this.restoreSession();
    this.listenToAuthChanges();
    setTimeout(() => this.restoreSession(), 0);
  this.listenToAuthChanges();
  }

  // ── Register ──────────────────────────────────────────────
  // Uses SECURITY DEFINER RPC to bypass RLS on org creation
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
  // signInWithPassword succeeds → onAuthStateChange fires SIGNED_IN
  // → loadSession() runs → navigates to /inbox
  // Do NOT call loadSession() here — onAuthStateChange handles it
  async login(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth
      .signInWithPassword({ email, password });

    if (error) throw new Error(error.message);
    // Navigation happens inside listenToAuthChanges → loadSession
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

  // ── Load session ──────────────────────────────────────────
  // Queries public.users joined with organisations, sets the
  // session signal, then navigates to /inbox
private async loadSession(): Promise<void> {
  try {
    const { data: { user: authUser } } = await this.supabase.client.auth.getUser();
    console.log('[Auth] loadSession — authUser:', authUser?.id ?? 'none');
    if (!authUser) return;

    const { data: profile, error } = await this.supabase.client
      .from('users')
      .select('*, organisations(*)')
      .eq('id', authUser.id)
      .single();

    console.log('[Auth] profile:', profile);
    console.log('[Auth] profile error:', error);

    if (error || !profile) return;

    const p = profile as any;
    this._session.set({
      user:         { ...p, email: authUser.email },
      organisation: p.organisations,
    });

    console.log('[Auth] navigating to /inbox');
    await this.router.navigate(['/inbox']);
  } catch (e) {
    console.error('[Auth] loadSession threw:', e);
  }
}


 private async restoreSession(): Promise<void> {
  const { data: { session } } = await this.supabase.client.auth.getSession();
  console.log('[Auth] restoreSession — has session:', !!session);
  if (session) await this.loadSession();
}

private listenToAuthChanges(): void {
  this.supabase.client.auth.onAuthStateChange(async (event: AuthChangeEvent) => {
    console.log('[Auth] event:', event);
    if (event === 'SIGNED_IN') {
      await this.loadSession();
    }
    if (event === 'SIGNED_OUT') {
      this._session.set(null);
    }
  });
}
}