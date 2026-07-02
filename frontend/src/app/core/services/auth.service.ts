// ============================================================
// auth.service.ts
// Handles all auth flows: register org, login, logout,
// invite user, password reset, and session state.
//
// Pattern:
//   1. Supabase Auth creates/validates the auth.users record
//   2. Our handle_new_user() DB trigger auto-creates public.users
//   3. The custom JWT hook injects org_id + user_role into the token
//   4. RLS policies use those JWT claims to filter every query
// ============================================================

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
  private router = inject(Router);

  // ── Reactive state ────────────────────────────────────────
  private _session = signal<AuthSession | null>(null);

  readonly session   = this._session.asReadonly();
  readonly user      = computed(() => this._session()?.user ?? null);
  readonly org       = computed(() => this._session()?.organisation ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly role      = computed(() => this._session()?.user.role ?? null);

  // Role helpers used in guards and templates
  readonly isAdmin   = computed(() =>
    ['admin', 'super_admin'].includes(this.role() ?? ''));
  readonly isManager = computed(() =>
    ['manager', 'admin', 'super_admin'].includes(this.role() ?? ''));
  readonly isSuperAdmin = computed(() => this.role() === 'super_admin');

  constructor() {
    this.restoreSession();
    this.listenToAuthChanges();
  }

  // ── Register a new organisation + admin user ──────────────
  async registerOrganisation(dto: RegisterOrgDto): Promise<void> {
    // Step 1: Create the organisation row first using .from()
    const { data: org, error: orgError } = await this.supabase.client
      .from('organisations')
      .insert({
        name: dto.org_name,
        slug: dto.org_slug,
        plan: 'free',
        mode: 'inbox',
      } as any)
      .select()
      .single();

    if (orgError) throw new Error(orgError.message);

    // Step 2: Sign up the admin user, passing org_id + role in metadata
    // The handle_new_user() trigger reads these and creates public.users
    const { error: authError } = await this.supabase.client.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        data: {
          org_id:    (org as Organisation).id,
          full_name: dto.full_name,
          role:      'admin',          // First user of an org is always admin
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) throw new Error(authError.message);
  }

  // ── Login ─────────────────────────────────────────────────
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth
      .signInWithPassword({ email, password });

    if (error) throw new Error(error.message);
    if (data.session) await this.loadSession();
  }

  // ── OAuth login (Google / Microsoft) ─────────────────────
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
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword,
    });
    if (error) throw new Error(error.message);
  }

  // ── Invite a team member ──────────────────────────────────
  // Uses Supabase Admin API via Edge Function to avoid exposing
  // the service_role key in the browser.
  async inviteUser(dto: InviteUserDto): Promise<void> {
    const { error } = await this.supabase.client.functions.invoke(
      'invite-user',
      {
        body: {
          email:     dto.email,
          full_name: dto.full_name,
          role:      dto.role,
          org_id:    this.org()?.id,
        },
      }
    );
    if (error) throw new Error(error.message);
  }

  // ── Update a team member's role ───────────────────────────
  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.supabase.client
      .from('users')
      .update({ role } as any)
      .eq('id', userId)
      .eq('org_id', this.org()?.id ?? '');

    if (error) throw new Error(error.message);
  }

  // ── Internal: load user + org into session signal ─────────
  private async loadSession(): Promise<void> {
    const { data: { user: authUser } } = await this.supabase.client.auth.getUser();
    if (!authUser) return;

    // Load public.users profile via .from()
    const { data: profile, error: profileError } = await this.supabase.client
      .from('users')
      .select('*, organisations(*)')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) return;

    const p = profile as any;

    this._session.set({
      user: {
        ...p,
        email: authUser.email,
      },
      organisation: p.organisations,
    });
  }

  // ── Internal: restore session on app init ─────────────────
  private async restoreSession(): Promise<void> {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session) await this.loadSession();
  }

  // ── Internal: react to Supabase auth state changes ────────
  private listenToAuthChanges(): void {
    this.supabase.client.auth.onAuthStateChange(async (event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await this.loadSession();
      }
      if (event === 'SIGNED_OUT') {
        this._session.set(null);
      }
    });
  }
}
