import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {createClient,SupabaseClient} from '@supabase/supabase-js';
import { Organisation } from './models/Organisation';
import { User } from './models/User';
import { Ticket } from './models/Ticket';
import { TicketMessage } from './models/TicketMessage';

export interface Database {
  public: {
    Tables: {
      organisations:   { Row: Organisation };
      users:           { Row: User };
      tickets:         { Row: Ticket };
      ticket_messages: { Row: TicketMessage };
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class Supabase {

    public client: SupabaseClient;

  constructor(){
    this.client=createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }
  get organisations() { return this.client.from('organisations'); }
  get users()         { return this.client.from('users'); }
  get tickets()       { return this.client.from('tickets'); }
  get ticketMessages(){ return this.client.from('ticket_messages'); }
  get auth()          { return this.client.auth; }
  get realtime()      { return this.client.channel.bind(this.client); }
}
