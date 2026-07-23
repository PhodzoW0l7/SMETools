import { MessageDirection, MessageChannel } from "./index";
import { User } from "./User";

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