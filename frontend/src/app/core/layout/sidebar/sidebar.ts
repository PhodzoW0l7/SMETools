import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  auth = inject(AuthService);

  // Core nav — all roles see these
  coreNav: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'ti-layout-dashboard' },
    { label: 'Inbox',     route: '/inbox',     icon: 'ti-inbox',   badge: 12 },
    { label: 'Tickets',   route: '/tickets',   icon: 'ti-ticket' },
    { label: 'Knowledge', route: '/knowledge', icon: 'ti-book' },
  ];

  // Admin nav — admin and super_admin only
  adminNav: NavItem[] = [
    { label: 'Performance', route: '/performance', icon: 'ti-chart-bar' },
    { label: 'Team',        route: '/teams',       icon: 'ti-users' },
    { label: 'Settings',    route: '/settings',    icon: 'ti-settings' },
  ];

  // Super admin nav — super_admin only
  superAdminNav: NavItem[] = [
    { label: 'Organisations', route: '/super-admin/orgs',      icon: 'ti-building' },
    { label: 'Audit log',     route: '/super-admin/audit-log', icon: 'ti-shield-check' },
  ];

  // Computed visibility
  showAdminNav  = computed(() => this.auth.isAdmin());
  showSuperNav  = computed(() => this.auth.isSuperAdmin());

  // User display
  userName  = computed(() => this.auth.user()?.full_name || this.auth.user()?.email || '');
  userRole  = computed(() => this.auth.user()?.role || '');
  userInitials = computed(() => {
    const name = this.auth.user()?.full_name || '';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  });

  async logout() {
    await this.auth.logout();
  }
}