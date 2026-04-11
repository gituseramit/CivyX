import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { VoiceService } from '../../core/services/voice.service';
import { WardService, Ward } from '../../core/services/ward.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <div class="min-h-screen pt-24 pb-12 overflow-hidden">
      <main class="max-w-[1440px] mx-auto px-6 h-full flex flex-col items-center justify-center">
        
        <!-- Hero Section -->
        <div class="w-full max-w-3xl text-center mb-16 reveal">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/5 border border-primary/10 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sovereign Urban Monitoring Active</span>
          </div>
          <h1 class="display-md mb-6">
            Your Voice, <br/>
            <span class="text-primary italic">Resolved by Intelligence.</span>
          </h1>
          <p class="text-dim text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Institutional grievance management powered by planetary-scale AI. Speak your truth, we handle the rest.
          </p>
        </div>

        <!-- Central Transmitter Portal -->
        <div class="relative w-full max-w-[500px] flex flex-col items-center mb-24 reveal-slow">
          
          <!-- Animated Background Orbs for Transmitter -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[80px] transition-all duration-700"
                 [ngClass]="{'scale-150 bg-primary/20 opacity-100': voice.isRecording, 'opacity-40': !voice.isRecording}"></div>
          </div>

          <!-- Pulsing Mic Button -->
          <div class="relative group z-10 mb-10">
            @if (voice.isRecording) {
              <div class="absolute inset-0 rounded-full border border-primary/40 ping-slow"></div>
              <div class="absolute inset-[-20px] rounded-full border border-primary/10 ping-slow" style="animation-delay: 0.5s"></div>
            }
            <button (click)="toggleRecording()" 
                    class="relative w-32 h-32 rounded-full mic-gradient border-4 border-white/5 glow-cyan flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95 cursor-pointer"
                    [ngClass]="{'recording': voice.isRecording}">
              <mat-icon class="text-4xl text-[#003642]">
                {{ voice.isRecording ? 'stop' : 'mic' }}
              </mat-icon>
            </button>
          </div>

          <!-- Status Indicator -->
          <div class="text-center">
            <h2 class="headline-sm text-white mb-2">{{ voice.isRecording ? 'Transmitting...' : 'Initiate Voice Protocol' }}</h2>
            <p class="label-md font-black">{{ voice.isRecording ? 'Audio Stream Active (Hindi/English)' : 'Tap to speak your grievance' }}</p>
          </div>
        </div>

        <!-- Lower Intelligence Tier: Ward Health Preview -->
        <div class="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 reveal-slow">
          <div class="md:col-span-2 institutional-glass rounded-xl p-8 flex flex-col md:flex-row items-center gap-10">
            <div class="flex-1">
              <div class="label-md mb-4">Spatial Health Index</div>
              <h3 class="headline-md mb-4">Citizen Satisfaction <span class="text-primary italic">Delta</span></h3>
              <p class="text-dim text-sm leading-relaxed mb-6">Real-time aggregate data across 12 urban sectors showing significant improvement in sanitation response times.</p>
              <a routerLink="/ward-map" class="btn-ghost !px-6 !py-2.5">Explore Ward Matrix</a>
            </div>
            
            <div class="flex flex-col gap-4 w-full md:w-64">
              @for (ward of recentWards; track ward.name) {
                <div class="flex items-center justify-between p-3 rounded bg-white/[0.03] border border-white/5">
                  <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full" [ngClass]="ward.dotClass"></div>
                    <span class="text-xs font-bold uppercase tracking-widest text-white/80">{{ ward.name }}</span>
                  </div>
                  <span class="text-[10px] font-black text-primary">{{ ward.health_score }}%</span>
                </div>
              }
            </div>
          </div>

          <div class="institutional-glass rounded-xl p-8 border-l-2 border-primary">
            <div class="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-6">
              <mat-icon class="text-primary">auto_awesome</mat-icon>
            </div>
            <h3 class="headline-sm mb-2">AI Dispatch</h3>
            <p class="text-dim text-sm leading-relaxed">
              94% of grievances are now automatically classified and routed within 120 seconds of submission.
            </p>
          </div>
        </div>

        <!-- Transparency Data Streams -->
        <div class="w-full max-w-5xl mb-24 reveal-slow">
           <div class="flex items-center gap-3 mb-8">
              <span class="w-12 h-px bg-primary/20"></span>
              <span class="label-md !text-[9px] text-white/40 uppercase tracking-[0.4em] font-black">Public Transparency Protocol</span>
           </div>
           
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <a routerLink="/public-feed" class="institutional-glass p-8 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group flex items-start gap-6">
                 <div class="w-14 h-14 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-[#061425] transition-all">
                    <mat-icon class="!text-3xl">sensors</mat-icon>
                 </div>
                 <div>
                    <h4 class="text-xl font-black text-white group-hover:text-primary mb-2 transition-all">Civic Pulse</h4>
                    <p class="text-xs text-dim leading-relaxed italic">Live anonymized intelligence stream of municipal grievances and resolutions.</p>
                 </div>
              </a>

              <a routerLink="/leaderboard" class="institutional-glass p-8 rounded-2xl border border-white/5 hover:border-amber-500/40 transition-all group flex items-start gap-6">
                 <div class="w-14 h-14 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-[#061425] transition-all text-amber-500">
                    <mat-icon class="!text-3xl">workspace_premium</mat-icon>
                 </div>
                 <div>
                    <h4 class="text-xl font-black text-white group-hover:text-amber-500 mb-2 transition-all">Officer Merit Matrix</h4>
                    <p class="text-xs text-dim leading-relaxed italic">Public ranking of departmental efficiency and resolution velocity metrics.</p>
                 </div>
              </a>
           </div>
        </div>
      </main>
    </div>
  `,
})
export class HomeComponent implements OnInit {
  recentWards: any[] = [];
  textInput = '';
  selectedWard = '';

  get fontVar() {
    return this.voice.isRecording ? "'FILL' 1" : "'FILL' 0";
  }

  constructor(
    public voice: VoiceService,
    private router: Router,
    private snack: MatSnackBar,
    public auth: AuthService,
    private wardService: WardService
  ) {}

  ngOnInit() {
    this.fetchWards();
  }

  fetchWards() {
    this.wardService.list().subscribe({
      next: (wards) => {
        this.recentWards = wards.slice(0, 3).map(w => ({
          ...w,
          dotClass: w.health_score > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                    w.health_score > 60 ? 'bg-amber-500' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
        }));
      }
    });
  }

  async toggleRecording() {
    if (this.voice.isRecording) {
      try {
        const { base64, filename } = await this.voice.stopRecording();
        sessionStorage.setItem('civyx_audio_b64', base64);
        sessionStorage.setItem('civyx_audio_name', filename);
        this.snack.open('Transmission Captured. Processing AI Intent...', 'OK', { duration: 3000 });
        this.router.navigate(['/submit-complaint']);
      } catch (e: any) {
        this.snack.open('Transmission Error: ' + e.message, 'OK', { duration: 3000 });
      }
    } else {
      try {
        await this.voice.startRecording();
      } catch (e: any) {
        this.snack.open('Access Denied: ' + e.message, 'OK', { duration: 4000 });
      }
    }
  }
}
