export type OrgMode = 'inbox' | 'ticketed';
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'urgent';
export type TicketCategory = 'billing' | 'support' | 'sales' | 'other';
export type SourceChannel = 'email' | 'whatsapp' | 'web_form';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageChannel = 'email' | 'whatsapp' | 'web_form' | 'internal';

export * from './AiTriage';
export * from './User';          // Adjust filenames to match yours exactly
export * from './Organisation';  // Adjust filenames to match yours exactly
export * from './AuthSession';   // Adjust filenames to match yours exactly
export * from './Ticket';
export * from './database.types';
export * from './InviteUserDto';
export * from './RegisterOrgDto';
