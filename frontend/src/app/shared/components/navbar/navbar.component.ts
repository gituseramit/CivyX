import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-[1000] navbar-glass transition-all duration-500">
      <div class="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
        
        <!-- Brand Identity -->
        <div class="flex items-center gap-4 cursor-pointer" routerLink="/">
          <div class="w-10 h-10 rounded bg-primary/10 border border-primary/20 flex items-center justify-center glow-cyan">
             <span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 1">shield_with_heart</span>
          </div>
          <div class="flex flex-col">
            <span class="text-lg font-black tracking-tight text-white leading-none">CivyX <span class="text-primary italic">AI</span></span>
            <span class="text-[9px] font-black uppercase tracking-[0.25em] text-primary/60 mt-1">Celestial Intelligence</span>
          </div>
        </div>

        <!-- Center Navigation -->
        <div class="hidden md:flex items-center gap-10">
          @if (!auth.isOfficer()) {
            <a routerLink="/" routerLinkActive="text-primary" [routerLinkActiveOptions]="{exact: true}" 
               class="nav-link">Transmitter</a>
            <a routerLink="/submit-complaint" routerLinkActive="text-primary"
               class="nav-link">Filing Portal</a>
            <a routerLink="/my-complaints" routerLinkActive="text-primary"
               class="nav-link">My Dossier</a>
          } @else {
            <a routerLink="/officer-dashboard" routerLinkActive="text-primary"
               class="nav-link">Command Centre</a>
          }
          <a routerLink="/ward-map" routerLinkActive="text-primary"
             class="nav-link">Ward Health</a>
        </div>

        <!-- Action Area -->
        <div class="flex items-center gap-4">
          @if (auth.currentUser()) {
            <div class="flex items-center gap-4 pl-6 border-l border-white/10">
              <div class="hidden lg:flex flex-col items-end">
                <span class="text-[10px] font-black text-white/90 uppercase tracking-widest">{{ auth.currentUser()?.name }}</span>
                <span class="text-[9px] text-primary font-bold uppercase tracking-tighter">{{ auth.isOfficer() ? 'Administrator' : 'Citizen' }}</span>
              </div>
              <div class="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-sm">
                {{ auth.currentUser()?.name?.charAt(0) }}
              </div>
              <button (click)="auth.logout()" class="p-2 text-white/40 hover:text-rose-400 transition-colors">
                <mat-icon>power_settings_new</mat-icon>
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-3">
              <a routerLink="/login" class="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-primary transition-all">Sign In</a>
              <a routerLink="/register" class="px-5 py-2.5 rounded bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">Register</a>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-link {
      @apply text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-all cursor-pointer relative py-2;
    }
    .nav-link::after {
      content: '';
      @apply absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300;
    }
    .nav-link:hover::after, .nav-link.text-primary::after {
      @apply w-full;
    }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
