import { TicketCategory } from './index'; 
import { TicketPriority } from './index';

export interface AiTriage {
  category?: TicketCategory;
  priority?: TicketPriority;
  draft_reply?: string;
  sentiment?: 'positive' | 'neutral' | 'frustrated' | 'angry';
  summary?: string;
}

