import { Component, inject, OnInit, signal } from '@angular/core';
import { Supabase } from '../../../../core/supabase/supabase';

@Component({
  selector: 'app-queue',
  imports: [],
  templateUrl: './queue.html',
  styleUrl: './queue.css',
})
export class Queue implements OnInit{
  
  private supabase = inject(Supabase);

  public inquiries =signal<Inquiry[]>([]);
  
}
