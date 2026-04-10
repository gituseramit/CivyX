import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-24 reveal">
      <div class="w-full max-w-md">
        
        <!-- Registration Card -->
        <div class="institutional-glass p-10 rounded-2xl relative overflow-hidden">
          
          <!-- Decorative Glow -->
          <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Header -->
          <div class="text-center mb-10 relative z-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 mb-6 glow-cyan">
               <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings: 'FILL' 1">person_add</span>
            </div>
            <h1 class="display-sm mb-3">Establish <span class="text-primary italic">Identity</span></h1>
            <p class="label-md tracking-[0.25em]">Civic Network Registration</p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onRegister()" #f="ngForm" class="relative z-10">
            <div class="mb-5">
              <label class="label-md mb-2.5 block">Full Legal Name</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-base">person</mat-icon>
                <input type="text" [(ngModel)]="name" name="name" required
                       class="data-portal-input pl-12" placeholder="Full Name" />
              </div>
            </div>

            <div class="mb-5">
              <label class="label-md mb-2.5 block">Institutional Email</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-base">alternate_email</mat-icon>
                <input type="email" [(ngModel)]="email" name="email" required
                       class="data-portal-input pl-12" placeholder="email@example.com" />
              </div>
            </div>

            <div class="mb-8">
              <label class="label-md mb-2.5 block">Create Auth-Key</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-base">vpn_key</mat-icon>
                <input type="password" [(ngModel)]="password" name="password" required
                       class="data-portal-input pl-12" placeholder="••••••••" />
              </div>
            </div>

            @if (error()) {
              <div class="mb-8 p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
                <mat-icon class="text-base text-rose-500">report</mat-icon>
                <span>{{ error() }}</span>
              </div>
            }

            <button type="submit" class="btn-sovereign w-full !py-4.5" [disabled]="loading()">
              @if (loading()) { <span class="animate-pulse-soft">Initializing Node...</span> }
              @else { Create Sovereign Account }
            </button>
          </form>

          <!-- Footer Links -->
          <div class="mt-12 text-center relative z-10">
            <p class="text-dim text-xs font-medium">
              Already a member of the collective?
              <a routerLink="/login" class="text-primary font-bold ml-1 hover:underline">Sign In</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error   = signal('');

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onRegister() {
    if (!this.email || !this.password || !this.name) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.name, this.email, this.password, 'citizen').subscribe({
      next: () => {
        this.router.navigate(['/my-complaints']);
      },
      error: (e) => {
        this.error.set(e?.error?.error || 'Registration failed.');
        this.loading.set(false);
      }
    });
  }
}
