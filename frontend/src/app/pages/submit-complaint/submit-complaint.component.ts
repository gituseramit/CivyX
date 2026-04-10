import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ComplaintService } from '../../core/services/complaint.service';
import { WardService, Ward } from '../../core/services/ward.service';
import { VoiceService } from '../../core/services/voice.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type Step = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-submit-complaint',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <div class="min-h-screen pt-28 pb-20 px-6 reveal">
      <div class="max-w-2xl mx-auto">
        
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/5 border border-primary/10 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Sovereign Filing Protocol 4.0</span>
          </div>
          <h1 class="display-sm mb-3">Submit <span class="text-primary italic">Complaint</span></h1>
          <p class="text-dim text-base max-w-sm mx-auto">Institutional grievance logging via AI-augmented classification engine.</p>
        </div>

        <!-- High-Fidelity Stepper -->
        <div class="flex items-center justify-between mb-16 px-4 relative">
          <div class="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 z-0 mx-8"></div>
          @for (s of [1,2,3,4]; track s) {
            <div class="relative z-10 flex flex-col items-center gap-3">
               <div [class]="step() >= s ? 'w-10 h-10 rounded-lg bg-primary text-[#003642] flex items-center justify-center font-black text-sm shadow-[0_0_20px_rgba(76,214,251,0.4)] transition-all duration-500 scale-110' : 
                                            'w-10 h-10 rounded-lg bg-surface-low text-dim flex items-center justify-center font-bold text-sm border border-white/10 transition-all duration-500'">
                 {{ s }}
               </div>
               <span class="label-md !text-[7px] font-black" [class.text-primary]="step() >= s" [class.text-dim]="step() < s">
                  {{ s === 1 ? 'Ingest' : s === 2 ? 'Spatial' : s === 3 ? 'Audit' : 'Filing' }}
               </span>
            </div>
          }
        </div>

        <!-- CONTENT STAGES -->
        <div class="institutional-glass p-10 rounded-2xl relative">
          
          <!-- STEP 1: Intelligence Ingestion -->
          @if (step() === 1) {
            <div class="reveal">
              <h2 class="headline-sm mb-2 text-white">Step 1: Intelligence Ingestion</h2>
              <p class="text-dim text-xs mb-10 font-medium">Record voice transmission or provide high-fidelity text description.</p>

              <!-- Central Mic transmitter -->
              <div class="flex flex-col items-center mb-12">
                 <div class="relative group mb-6">
                    @if (voice.isRecording) {
                      <div class="absolute inset-0 rounded-full border border-primary/40 ping-slow"></div>
                    }
                    <button (click)="toggleRecording()" 
                            class="relative w-20 h-20 rounded-full mic-gradient border-2 border-white/10 flex items-center justify-center transition-all duration-500 hover:scale-105 active:scale-95"
                            [ngClass]="{'recording': voice.isRecording}">
                      <mat-icon style="font-size:32px; width:32px; height:32px" class="text-[#003642]">
                        {{ voice.isRecording ? 'stop' : 'mic' }}
                      </mat-icon>
                    </button>
                 </div>
                 <p class="label-md !text-[9px]" [ngClass]="voice.isRecording ? 'text-primary' : 'text-dim'">
                    {{ voice.isRecording ? '📡 Transmission Initialized' : 'Tap to Initiate Voice Upload' }}
                 </p>
                 
                 @if (audioReady()) {
                   <div class="mt-6 flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div class="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                         <mat-icon class="text-lg">check_circle</mat-icon>
                      </div>
                      <div class="flex-1">
                         <p class="text-[10px] font-black text-white/90 uppercase tracking-widest">Voice Packet Ready</p>
                         <p class="text-[9px] text-primary/70 font-bold">{{ audioSeconds() }}s Secure Stream</p>
                      </div>
                      <button (click)="clearAudio()" class="text-[9px] font-black text-rose-400/50 hover:text-rose-400 transition-all uppercase tracking-widest px-2">Purge</button>
                   </div>
                 }
              </div>

              <div class="flex items-center gap-3 mb-8">
                <div class="h-px flex-1 bg-white/5"></div>
                <span class="label-md !text-[8px] text-dim/50">OR MANUAL INPUT</span>
                <div class="h-px flex-1 bg-white/5"></div>
              </div>

              <div class="mb-10">
                <label class="label-md mb-3 block">Context Description</label>
                <textarea [(ngModel)]="textInput" class="data-portal-input h-32 resize-none text-sm font-medium" 
                          placeholder="Provide details of the grievance..."></textarea>
              </div>

              <button (click)="step1Next()" class="btn-sovereign w-full !py-4.5" 
                      [disabled]="!audioReady() && !textInput.trim()">
                Next: Spatial Resolution →
              </button>
            </div>
          }

          <!-- STEP 2: Spatial Resolution -->
          @if (step() === 2) {
            <div class="reveal">
              <h2 class="headline-sm mb-2 text-white">Step 2: Spatial Resolution</h2>
              <p class="text-dim text-xs mb-10 font-medium">Designate the geographical sector for municipal response.</p>

              <div class="mb-12">
                <label class="label-md mb-3 block">Target Ward Sector</label>
                <div class="relative group">
                  <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">location_searching</mat-icon>
                  <select [(ngModel)]="wardId" class="data-portal-input pl-12 appearance-none cursor-pointer">
                    <option value="" disabled selected>Select Authority Ward...</option>
                    @for (ward of wards(); track ward.id) {
                      <option [value]="ward.id">{{ ward.name }} Sector</option>
                    }
                  </select>
                  <mat-icon class="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none">expand_more</mat-icon>
                </div>
              </div>

              <div class="flex gap-4">
                <button (click)="step.set(1)" class="btn-ghost flex-1">Previous Stage</button>
                <button (click)="step2Next()" class="btn-sovereign flex-1 !py-4" [disabled]="!wardId">
                  @if (classifying()) { <span class="animate-pulse-soft">🤖 Initializing AI Review...</span> }
                  @else { Execute AI Audit → }
                </button>
              </div>
            </div>
          }

          <!-- STEP 3: AI Audit Review -->
          @if (step() === 3) {
            <div class="reveal">
              <div class="flex items-center justify-between mb-8">
                 <div>
                   <h2 class="headline-sm mb-2 text-white">Step 3: AI Audit Review</h2>
                   <p class="text-dim text-xs font-medium">Review and augment automated classification vectors.</p>
                 </div>
                 <div class="w-12 h-12 rounded bg-primary/10 border border-primary/20 flex items-center justify-center glow-cyan">
                    <mat-icon class="text-primary">shield</mat-icon>
                 </div>
              </div>

              <div class="space-y-6 mb-12">
                <div>
                   <label class="label-md mb-2.5 block">Automated Case Title</label>
                   <input type="text" [(ngModel)]="aiTitle" class="data-portal-input" />
                </div>

                <div class="grid grid-cols-2 gap-6">
                   <div>
                      <label class="label-md mb-2.5 block">Category Vector</label>
                      <select [(ngModel)]="aiCategory" class="data-portal-input appearance-none">
                        @for (cat of categories; track cat) {
                          <option [value]="cat">{{ cat | uppercase }}</option>
                        }
                      </select>
                   </div>
                   <div>
                      <label class="label-md mb-2.5 block">Priority Rank</label>
                      <select [(ngModel)]="aiSeverity" class="data-portal-input appearance-none">
                        @for (s of [1,2,3,4,5]; track s) {
                          <option [value]="s">LEVEL {{ s }} — {{ severityLabel(s) }}</option>
                        }
                      </select>
                   </div>
                </div>

                <div>
                   <label class="label-md mb-2.5 block">Target Department Authority</label>
                   <input type="text" [(ngModel)]="aiDepartment" class="data-portal-input" />
                </div>
              </div>

              @if (aiSummary) {
                <div class="mb-12 p-6 rounded-xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                   <div class="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                   <h4 class="label-md !text-primary !tracking-widest mb-3">Sovereign Executive Summary</h4>
                   <p class="text-sm italic text-white/90 leading-relaxed">{{ aiSummary }}</p>
                </div>
              }

              <div class="flex gap-4">
                <button (click)="step.set(2)" class="btn-ghost flex-1">Back</button>
                <button (click)="submitFinal()" class="btn-sovereign flex-1 !py-4" [disabled]="submitting()">
                  @if (submitting()) { <span class="animate-pulse-soft">Finalizing Protocol...</span> }
                  @else { Authenticate & File ✓ }
                </button>
              </div>
            </div>
          }

          <!-- STEP 4: Success Terminal -->
          @if (step() === 4) {
            <div class="reveal text-center py-10">
              <div class="w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-10 glow-cyan-strong">
                 <mat-icon style="font-size: 52px; width: 52px; height: 52px" class="text-primary">verified</mat-icon>
              </div>
              
              <h1 class="display-sm mb-4">Protocol <span class="text-primary italic">Successful</span></h1>
              <p class="text-dim text-sm mb-12 max-w-sm mx-auto leading-relaxed">Your grievance has been successfully logged into the sovereign ledger and routed for immediate municipal rectification.</p>
              
              <div class="institutional-glass !bg-white/[0.03] p-8 rounded-xl border border-white/5 mb-12">
                 <p class="label-md !text-primary !tracking-widest mb-2">OFFICIAL TRANSACTION ID</p>
                 <p class="font-mono text-2xl font-black text-white tracking-[0.2em]">{{ successId() }}</p>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                 <a routerLink="/my-complaints" class="btn-sovereign !px-10">View My Dossier</a>
                 <button (click)="resetForm()" class="btn-ghost !px-10">Initiate New Filing</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .glow-cyan-strong { filter: drop-shadow(0 0 25px rgba(76, 214, 251, 0.55)); }
  `]
})
export class SubmitComplaintComponent implements OnInit {
  step       = signal<Step>(1);
  textInput  = '';
  wardId     = '';
  audioB64   = '';
  audioName  = '';
  audioReady = signal(false);
  audioSeconds = signal(0);
  classifying = signal(false);
  submitting  = signal(false);
  aiClassified = signal(false);
  successId  = signal('');

  aiTitle      = '';
  aiCategory   = 'sanitation';
  aiSeverity   = 3;
  aiDepartment = '';
  aiSummary    = '';

  wards      = signal<Ward[]>([]);
  categories = ['road','water','power','sanitation','drainage','streetlight','safety','corruption'];

  private recordingStart = 0;

  constructor(
    private complaintSvc: ComplaintService,
    private wardSvc: WardService,
    public voice: VoiceService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.wardSvc.list().subscribe(w => this.wards.set(w));

    // Pre-fill from home page
    const prefill = sessionStorage.getItem('civyx_text_prefill');
    if (prefill) { this.textInput = prefill; sessionStorage.removeItem('civyx_text_prefill'); }

    const ab64 = sessionStorage.getItem('civyx_audio_b64');
    const aname = sessionStorage.getItem('civyx_audio_name');
    if (ab64) {
      this.audioB64 = ab64; this.audioName = aname || 'recording.webm';
      this.audioReady.set(true);
      sessionStorage.removeItem('civyx_audio_b64');
      sessionStorage.removeItem('civyx_audio_name');
    }
  }

  async toggleRecording() {
    if (this.voice.isRecording) {
      try {
        const { base64, filename } = await this.voice.stopRecording();
        this.audioB64 = base64; this.audioName = filename;
        this.audioReady.set(true);
        this.audioSeconds.set(Math.round((Date.now() - this.recordingStart) / 1000));
      } catch (e: any) {
        this.snack.open('Recording error: ' + e.message, 'OK', { duration: 3000 });
      }
    } else {
      try {
        this.recordingStart = Date.now();
        await this.voice.startRecording();
      } catch (e: any) {
        this.snack.open('Mic access error: ' + e.message, 'OK', { duration: 3000 });
      }
    }
  }

  clearAudio() { this.audioB64 = ''; this.audioReady.set(false); }

  step1Next() {
    if (!this.audioReady() && !this.textInput.trim()) return;
    this.step.set(2);
  }

  step2Next() {
    if (!this.wardId) return;
    this.classifying.set(true);

    const payload: any = { ward_id: this.wardId };
    if (this.audioReady()) { payload.audio_base64 = this.audioB64; payload.audio_name = this.audioName; }
    else { payload.description = this.textInput; }

    this.complaintSvc.submit(payload).subscribe({
      next: (res) => {
        this.aiTitle      = res.title;
        this.aiCategory   = res.category;
        this.aiSeverity   = res.severity;
        this.aiDepartment = res.department;
        this.aiSummary    = res.summary || '';
        this.aiClassified.set(res.ai_classified);
        this.successId.set(res.id);
        this.classifying.set(false);
        this.step.set(3);
      },
      error: (e) => {
        if (e.status === 401) { this.classifying.set(false); return; }
        this.snack.open(e?.error?.error || 'Classification failed.', 'OK', { duration: 5000 });
        this.classifying.set(false);
      }
    });
  }

  submitFinal() {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.step.set(4);
    }, 1200);
  }

  resetForm() {
    this.textInput = ''; this.wardId = ''; this.audioB64 = ''; this.audioReady.set(false);
    this.aiTitle = ''; this.aiCategory = 'sanitation'; this.aiSeverity = 3; this.aiDepartment = '';
    this.step.set(1);
  }

  severityLabel(s: number): string {
    return ['','Minimal','Moderate','Standard','Elevated','Critical'][s];
  }
}
