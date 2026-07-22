import { SourceChannel } from ".";
import { AiTriage } from "./AiTriage";

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


