import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private router = inject(Router);
  private auth =inject(AuthService);

  // Computes active page titles out of route tree vectors dynamically
  protected pageTitle = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const urlSegments = this.router.url.split('/');
        const primarySegment = urlSegments[1] || 'Dashboard';
        return primarySegment.charAt(0).toUpperCase() + primarySegment.slice(1);
      })
    ),
    { initialValue: 'Dashboard' }
  );

  protected async onLogout():Promise<void>{
    try{
      await this.auth.logout();
      }catch(err){
        console.error('Logout processing exception',err)
      }
  }
}
