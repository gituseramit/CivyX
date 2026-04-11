import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <div class="min-h-screen flex items-center justify-center px-4 py-24 reveal">
      <div class="w-full max-w-md">
        
        <!-- Portal Card -->
        <div class="institutional-glass p-10 rounded-2xl relative overflow-hidden">
          
          <!-- Decorative Glow -->
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Header -->
          <div class="text-center mb-12 relative z-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 mb-6 glow-cyan">
               <mat-icon class="text-primary text-3xl">terminal</mat-icon>
            </div>
            <h1 class="display-sm mb-3">Portal <span class="text-primary italic">Access</span></h1>
            <p class="label-md tracking-[0.25em]">Sovereign Identity Protocol</p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onLogin()" #f="ngForm" class="relative z-10">
            <div class="mb-6">
              <label class="label-md mb-3 block">Designated Email</label>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-base">alternate_email</mat-icon>
                <input type="email" [(ngModel)]="email" name="email" required
                       class="data-portal-input pl-12" placeholder="agent@civyx.ai" />
              </div>
            </div>

            <div class="mb-10">
              <div class="flex items-center justify-between mb-3">
                <label class="label-md block">Secure Auth-Key</label>
                <a routerLink="/login" class="text-[9px] font-black text-primary/40 uppercase tracking-widest hover:text-primary transition-all">Recover Key</a>
              </div>
              <div class="relative">
                <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50 text-base">lock</mat-icon>
                <input [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                       class="data-portal-input pl-12 pr-12" placeholder="••••••••" />
                <button type="button" (click)="showPwd=!showPwd"
                        class="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors">
                  <mat-icon style="font-size:18px;width:18px;height:18px">{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="mb-8 p-4 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
                <mat-icon class="text-base text-rose-500">report</mat-icon>
                <span class="font-medium">{{ error() }}</span>
              </div>
            }

            <button type="submit" class="btn-sovereign w-full !py-4.5" [disabled]="loading()">
              @if (loading()) { <span class="animate-pulse-soft">Verifying Access Level...</span> }
              @else { Authenticate Identity }
            </button>
          </form>

          <!-- Footer Links -->
          <div class="mt-12 text-center relative z-10">
            <p class="text-dim text-xs font-medium">
              New to planetary intelligence?
              <a routerLink="/register" class="text-primary font-black ml-1 hover:underline">Establish Node</a>
            </p>
          </div>

        </div>

        <!-- System Credentials -->
        <div class="mt-8 px-6 reveal-slow" style="animation-delay: 0.2s">
          <div class="flex items-center gap-2 mb-3">
             <div class="h-px flex-1 bg-white/5"></div>
             <span class="label-md !text-[8px] text-dim/40">Authorized Demo Access</span>
             <div class="h-px flex-1 bg-white/5"></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
             <div class="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-copy">
                <p class="text-[8px] font-black text-dim uppercase tracking-[0.2em] mb-1">Citizen Access</p>
                <p class="text-[9px] font-mono text-primary/70">citizen&#64;gramvaani.in</p>
             </div>
             <div class="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-copy">
                <p class="text-[8px] font-black text-dim uppercase tracking-[0.2em] mb-1">Officer Access</p>
                <p class="text-[9px] font-mono text-primary/70">officer&#64;gramvaani.in</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  showPwd = false;
  loading = signal(false);
  error   = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onLogin() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) { this.router.navigateByUrl(returnUrl); return; }
        this.router.navigate([res.user.role === 'officer' ? '/officer-dashboard' : '/my-complaints']);
      },
      error: (e) => {
        this.error.set(e?.error?.error || 'Authorization Failed.');
        this.loading.set(false);
      }
    });
  }
}
