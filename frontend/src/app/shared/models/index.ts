// ============================================================
// models/index.ts
// TypeScript interfaces that mirror the Supabase DB schema.
// Keep these in sync with your migrations.
// ============================================================

export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type OrgMode = 'inbox' | 'ticketed';
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent' | 'viewer';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'urgent';
export type TicketCategory = 'billing' | 'support' | 'sales' | 'other';
export type SourceChannel = 'email' | 'whatsapp' | 'web_form';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageChannel = 'email' | 'whatsapp' | 'web_form' | 'internal';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  mode: OrgMode;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // Joined from auth.users when needed
  email?: string;
}

export interface AiTriage {
  category?: TicketCategory;
  priority?: TicketPriority;
  draft_reply?: string;
  sentiment?: 'positive' | 'neutral' | 'frustrated' | 'angry';
  summary?: string;
}

export interface Ticket {
  id: string;
  org_id: string;
  assignee_id?: string;
  ticket_ref: string;
  source: SourceChannel;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  sender_identity: string;
  subject?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: TicketCategory;
  thread_id?: string;
  ai_triage?: AiTriage;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // Joined fields
  assignee?: User;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id?: string;
  direction: MessageDirection;
  channel: MessageChannel;
  body: string;
  is_internal: boolean;
  email_message_id?: string;
  sent_at: string;
  // Joined
  author?: User;
}

// DTO shapes used when creating records from Angular
export interface RegisterOrgDto {
  org_name: string;
  org_slug: string;
  full_name: string;
  email: string;
  password: string;
}

export interface InviteUserDto {
  email: string;
  full_name: string;
  role: UserRole;
}

export interface AuthSession {
  user: User;
  organisation: Organisation;
}