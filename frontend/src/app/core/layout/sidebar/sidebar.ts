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

  coreNav = computed<NavItem[]>(() => {
  const role = this.auth.role();

  if (role === 'super_admin') {
    return [
      {
        label: 'Dashboard',
        route: '/super-admin/dashboard',
        icon: 'ti-layout-dashboard'
      },
      {
        label: 'Organisations',
        route: '/super-admin/organisations',
        icon: 'ti-building'
      },
    ];
  }

  if (role === 'admin' || role === 'manager') {
    return [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: 'ti-layout-dashboard'
      },
      {
        label: 'Inbox',
        route: '/inbox',
        icon: 'ti-inbox'
      },
      {
        label: 'Tickets',
        route: '/tickets',
        icon: 'ti-ticket'
      },
      {
        label: 'Knowledge',
        route: '/knowledge',
        icon: 'ti-book'
      }
    ];
  }

  return [
    {
      label: 'Inbox',
      route: '/inbox',
      icon: 'ti-inbox'
    },
    {
      label: 'Tickets',
      route: '/tickets',
      icon: 'ti-ticket'
    },
    {
      label: 'Knowledge',
      route: '/knowledge',
      icon: 'ti-book'
    }
  ];
});
}