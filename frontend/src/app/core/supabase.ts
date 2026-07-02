import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {createClient,SupabaseClient} from '@supabase/supabase-js'

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
  
}
