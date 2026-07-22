export type OrgMode = 'inbox' | 'ticketed';
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'agent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'urgent';
export type TicketCategory = 'billing' | 'support' | 'sales' | 'other';
export type SourceChannel = 'email' | 'whatsapp' | 'web_form';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageChannel = 'email' | 'whatsapp' | 'web_form' | 'internal';
