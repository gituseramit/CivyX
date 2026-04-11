import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <!-- Top Nav Overlay -->
    @if (!isAdminRoute) {
      <app-navbar></app-navbar>
    }

    <!-- Main Content Stage -->
    <main class="relative min-h-screen">
      <router-outlet></router-outlet>
    </main>

    <!-- Global Background Elements (Persisted across transitions) -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden" style="z-index: -2;">
      <!-- Orbital Glowing Sphere -->
      <div class="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-40"
           style="background: radial-gradient(circle, rgba(76,214,251,0.15) 0%, transparent 70%); filter: blur(100px); animation: float 20s ease-in-out infinite;"></div>
      
      <!-- Center Deep Atmosphere Overlay -->
      <div class="absolute inset-0" 
           style="background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(6, 20, 37, 0.4) 100%);"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background: #061425;
      min-height: 100vh;
      color: #D6E3FC;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(20px) scale(1.05); }
    }
  `]
})
export class AppComponent {
  title = 'civyx-frontend';
  isAdminRoute = false;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin');
      }
    });
  }
}

