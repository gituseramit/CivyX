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
    <div class="min-h-screen flex items-center justify-center px-4 py-16 reveal relative overflow-hidden bg-[#050B14]">
      <!-- Background Effects -->
      <div class="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="w-full max-w-2xl relative z-10">
        <!-- Registration Card -->
        <div class="institutional-glass p-8 md:p-12 rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
          
          <!-- Header -->
          <div class="text-center mb-12">
            <h1 class="text-5xl font-black tracking-tight text-white mb-3">
              Establish <span class="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent italic">Identity</span>
            </h1>
            <p class="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Civic Accountability Framework v1.0</p>
          </div>

          <ng-container *ngIf="!registeredOfficerId()">
            <!-- Role Selection -->
            <div class="flex p-1.5 bg-black/40 border border-white/5 rounded-2xl mb-12 shadow-inner">
              <button type="button" (click)="role = 'citizen'" 
                      [ngClass]="{'bg-white/10 shadow-lg text-primary': role === 'citizen', 'text-white/40': role !== 'citizen'}"
                      class="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3">
                <mat-icon class="scale-90">fingerprint</mat-icon>
                Citizen Node
              </button>
              <button type="button" (click)="role = 'officer'" 
                      [ngClass]="{'bg-amber-500/10 shadow-lg text-amber-500': role === 'officer', 'text-white/40': role !== 'officer'}"
                      class="flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3">
                <mat-icon class="scale-90">verified_user</mat-icon>
                Gov. Officer
              </button>
            </div>

            <div class="mb-10 text-center animate-fade-in">
               <p *ngIf="role === 'citizen'" class="text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
                 Secure your digital presence to report local issues and participate in sovereign ward governance.
               </p>
               <p *ngIf="role === 'officer'" class="text-xs text-amber-500/60 leading-relaxed max-w-sm mx-auto font-medium">
                 Official personnel access only. Credentials will undergo institutional verification by the Command Center.
               </p>
            </div>

            <!-- Form -->
            <form (ngSubmit)="onRegister()" #f="ngForm" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              <div class="md:col-span-2 group">
                <label class="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block font-bold transition-colors group-focus-within:text-primary">Legal Full Name</label>
                <input type="text" [(ngModel)]="name" name="name" required
                       class="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all placeholder:text-white/10" placeholder="e.g. Aditi Sharma" />
              </div>

              <div class="group">
                <label class="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block font-bold group-focus-within:text-primary">Dossier Email</label>
                <input type="email" [(ngModel)]="email" name="email" required
                       class="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all placeholder:text-white/10" placeholder="name@gov.in" />
              </div>

              <div class="group">
                <label class="text-[10px] uppercase tracking-widest text-white/30 mb-2.5 block font-bold group-focus-within:text-primary">Access Secret</label>
                <input type="password" [(ngModel)]="password" name="password" required
                       class="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-all placeholder:text-white/10" placeholder="••••••••" />
              </div>

              <!-- Officer Specific Fields -->
              <ng-container *ngIf="role === 'officer'">
                <div class="md:col-span-2 my-2 py-4 border-y border-white/5 bg-amber-500/[0.02] -mx-4 px-4">
                   <p class="text-[10px] uppercase tracking-[0.2em] font-black text-amber-500/80">Security Clearance Requirements</p>
                </div>

                <div class="group">
                  <label class="text-[10px] uppercase tracking-widest text-amber-500/40 mb-2.5 block font-bold group-focus-within:text-amber-500">Employee ID</label>
                  <input type="text" [(ngModel)]="employeeId" name="employeeId" required
                         class="w-full bg-amber-500/[0.02] border border-amber-500/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-amber-500/30 focus:bg-amber-500/5 transition-all placeholder:text-white/10" placeholder="MCD-XXXX" />
                </div>

                <div class="group">
                  <label class="text-[10px] uppercase tracking-widest text-amber-500/40 mb-2.5 block font-bold group-focus-within:text-amber-500">Department</label>
                  <select [(ngModel)]="department" name="department" required
                          class="w-full bg-amber-500/[0.02] border border-amber-500/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-amber-500/30 focus:bg-amber-500/5 transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Select Segment</option>
                    <option value="Sanitation" class="bg-[#050B14]">Sanitation & Waste</option>
                    <option value="Public Works" class="bg-[#050B14]">Public Works (PWD)</option>
                    <option value="Water" class="bg-[#050B14]">Water Authority</option>
                  </select>
                </div>
              </ng-container>

              <div class="md:col-span-2 mt-8">
                <button type="submit" [disabled]="loading()"
                        [ngClass]="{'bg-primary shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:scale-[1.02]': role === 'citizen', 'bg-amber-600 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-[1.02] text-white': role === 'officer'}"
                        class="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all duration-300 disabled:opacity-50 disabled:grayscale">
                  <span *ngIf="!loading()">Initiate Protocol</span>
                  <span *ngIf="loading()" class="flex items-center justify-center gap-3">
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Establishing...
                  </span>
                </button>
              </div>
            </form>
          </ng-container>

          <ng-container *ngIf="registeredOfficerId()">
            <div class="text-center py-10 animate-fade-in">
              <div class="w-24 h-24 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                <mat-icon class="text-amber-500 text-5xl h-auto w-auto">shield</mat-icon>
              </div>
              <h2 class="text-3xl font-black text-white mb-3 uppercase tracking-tight">Dossier Locked</h2>
              <p class="text-[10px] tracking-[0.4em] text-amber-500 mb-10 font-black uppercase">Institutional Verification Required</p>
              
              <div class="bg-black/40 border border-white/5 rounded-2xl p-6 mb-10 text-left">
                <p class="text-[8px] text-white/30 uppercase tracking-[0.3em] mb-3 font-black">Officer Signature Hash:</p>
                <code class="font-mono text-amber-500 text-xs break-all select-all block bg-white/5 p-4 rounded-xl border border-white/5">
                  {{ registeredOfficerId() }}
                </code>
              </div>
              
              <a routerLink="/login" class="inline-block py-4 px-10 border border-amber-500/30 text-amber-500 text-[10px] uppercase tracking-[0.3em] font-black rounded-xl hover:bg-amber-500/10 transition-all">Return to Terminal</a>
            </div>
          </ng-container>

          <!-- Footer -->
          <div class="mt-12 pt-8 border-t border-white/5 text-center">
            <p class="text-white/30 text-[10px] font-bold uppercase tracking-widest">
              Existing credentials found?
              <a routerLink="/login" class="text-primary hover:text-cyan-400 ml-2 transition-colors">Authorize Access</a>
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
  employeeId = '';
  designation = '';
  department = '';
  loading = signal(false);
  error   = signal('');
  role: 'citizen' | 'officer' = 'citizen';
  registeredOfficerId = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  onRegister() {
    if (!this.email || !this.password || !this.name) return;
    this.loading.set(true);
    const extra = { employeeId: this.employeeId, designation: this.designation, department: this.department };
    this.auth.register(this.name, this.email, this.password, this.role, extra).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (this.role === 'officer') {
          this.auth.logout(); 
          this.registeredOfficerId.set(res.user?.id || 'PENDING_SIG_HASH');
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (e) => {
        this.error.set(e?.error?.error || 'Registration failed.');
        this.loading.set(false);
      }
    });
  }
}
