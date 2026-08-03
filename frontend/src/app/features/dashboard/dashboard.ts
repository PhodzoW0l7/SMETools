import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Supabase } from '../../core/supabase';
import { Ticket } from '../../core/models/index';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private supabase = inject(Supabase);

  // Structural reactive metrics tracking state matrices
  protected totalOpenCount = signal<number>(27);
  protected urgentCount = signal<number>(4);
  protected resolvedCount = signal<number>(12);
  protected avgResponseTime = signal<string>('1.4h');

  // Channel metrics mapping array
  protected channelMetrics = signal([
    { name: 'Email', percentage: 50, color: 'bg-blue-600', text: 'text-blue-600' },
    { name: 'WA', percentage: 31, color: 'bg-indigo-500', text: 'text-indigo-500' },
    { name: 'Form', percentage: 19, color: 'bg-amber-500', text: 'text-amber-500' }
  ]);

  // Last 7 days ticket counts array tracking metrics 
  protected volumeHistory = signal([
    { day: 'Mon', count: 12, height: 'h-16' },
    { day: 'Tue', count: 19, height: 'h-24' },
    { day: 'Wed', count: 15, height: 'h-20' },
    { day: 'Thu', count: 27, height: 'h-36' },
    { day: 'Fri', count: 18, height: 'h-24' },
    { day: 'Sat', count: 8, height: 'h-10' },
    { day: 'Sun', count: 14, height: 'h-16' }
  ]);

  // Tabular ticket context matching your mockup data structures
  protected recentTickets = signal<Partial<Ticket>[]>([
    { ticket_ref: '#1024', subject: 'Email login failing', status: 'in_progress', priority: 'urgent', source: 'email' },
    { ticket_ref: '#1023', subject: 'Reset password link not working', status: 'open', priority: 'medium', source: 'whatsapp' },
    { ticket_ref: '#1022', subject: 'Invoice query — March billing', status: 'resolved', priority: 'low', source: 'web_form' },
    { ticket_ref: '#1021', subject: 'Cannot upload profile picture', status: 'in_progress', priority: 'medium', source: 'email' }
  ]);

  ngOnInit(): void {
    // Live Supabase query metrics execution pipeline will map here next
  }

  protected getPriorityClass(priority?: string): string {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  protected getStatusClass(status?: string): string {
    switch (status) {
      case 'in_progress': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  }
}
