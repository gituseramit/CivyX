import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComplaintService, ComplaintDetail, TimelineEntry, AIReport, ResolutionDetails } from '../../core/services/complaint.service';
import { MatIconModule } from '@angular/material/icon';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-my-complaints',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, LoadingSpinnerComponent],
  template: `
    <div class="min-h-screen pt-28 pb-20 px-6 reveal">
      <div class="max-w-4xl mx-auto">
        
        <!-- Header Section -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="w-10 h-px bg-primary"></span>
              <span class="label-md text-primary">Personal Archive</span>
            </div>
            <h1 class="display-sm">My <span class="text-primary italic">Dossier</span></h1>
            <p class="text-dim text-base mt-2">Comprehensive history of your institutional interactions and resolution intelligence.</p>
          </div>
          <a routerLink="/submit-complaint" class="btn-sovereign py-3 shadow-lg flex items-center gap-3">
            <mat-icon class="text-lg">add_circle</mat-icon>
            Initiate New Filing
          </a>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-32 text-center">
            <div class="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
            <p class="label-md tracking-[0.3em] font-black text-primary/40">Fetching Sovereign Records...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && complaints().length === 0) {
          <div class="institutional-glass p-16 rounded-2xl text-center border-dashed border-white/10">
             <div class="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-8">
                <mat-icon class="!text-4xl text-white/10">folder_open</mat-icon>
             </div>
            <h3 class="headline-sm mb-3">No Active Dossiers</h3>
            <p class="text-dim text-sm mb-8 max-w-sm mx-auto leading-relaxed">Your personal grievance archive is currently empty. Initiate a voice or text filing to begin tracking resolution intelligence.</p>
            <a routerLink="/submit-complaint" class="btn-ghost !px-8">File First Grievance</a>
          </div>
        }

        <!-- Complaints List -->
        <div class="space-y-6">
          @for (c of complaints(); track c.id) {
            <div class="institutional-glass rounded-2xl transition-all duration-300 overflow-hidden group"
                 [ngClass]="{'border-primary/20 ring-1 ring-primary/10': expandedId() === c.id}">
              
              <!-- Card Header -->
              <div class="p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                   (click)="toggle(c.id)">
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-3">
                     <span class="text-[10px] font-black text-dim uppercase tracking-widest font-mono">{{ c.id.slice(0,8) }}</span>
                     <div class="h-3 w-px bg-white/10"></div>
                     <span class="text-[10px] font-bold text-white/40">{{ c.created_at | date:'dd MMM yyyy' }}</span>
                  </div>
                  <h3 class="headline-sm text-white group-hover:text-primary transition-colors truncate max-w-xl">{{ c.title }}</h3>
                  
                  <div class="flex flex-wrap gap-2 mt-4">
                    <span class="chip chip-slate italic">{{ c.category }}</span>
                    <span class="chip" [ngClass]="{
                      'chip-primary': c.status === 'submitted',
                      'chip-indigo': c.status === 'acknowledged',
                      'chip-amber': c.status === 'in_progress',
                      'chip-emerald': c.status === 'resolved'
                    }">{{ c.status === 'resolved' ? 'Resolved' : c.status === 'in_progress' ? 'Rectification Phase' : c.status === 'acknowledged' ? 'Intelligence Confirmed' : c.status }}</span>
                    @if (c.ai_classified) {
                      <span class="chip chip-primary !bg-primary/5 !border-primary/10 !text-primary/70 flex items-center gap-1">
                        <mat-icon class="!text-[10px] w-auto h-auto glow-cyan">auto_awesome</mat-icon> AI Verified
                      </span>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-6 shrink-0">
                   <div class="flex flex-col items-end">
                      <p class="label-md !text-[8px] mb-1">Ward Authority</p>
                      <p class="text-xs font-black text-white/80 tracking-wide">{{ c.ward_name || 'System' }}</p>
                   </div>
                   <div class="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center transition-all"
                        [ngClass]="expandedId() === c.id ? 'bg-primary/10 border-primary/20 text-primary rotate-180' : 'bg-white/5 text-dim'">
                      <mat-icon>expand_more</mat-icon>
                   </div>
                </div>
              </div>

              <!-- Expanded Intelligence Timeline -->
              @if (expandedId() === c.id) {
                <div class="border-t border-white/5 bg-white/[0.01] p-8 reveal">
                  
                    <div class="flex items-center gap-3 mb-8">
                       <mat-icon class="text-primary text-lg">analytics</mat-icon>
                       <h4 class="label-md !text-white/80">Resolution Intelligence Timeline</h4>
                    </div>

                    @if (timelineLoading()) {
                      <div class="flex items-center gap-4 py-8">
                        <div class="w-5 h-5 border border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <span class="label-md !text-[9px]">Decrypting History...</span>
                      </div>
                    } @else {
                      <div class="relative pl-8 border-l border-white/5 space-y-10">
                        @for (t of timeline(); track t.changed_at; let last = $last) {
                          <div class="relative">
                             <!-- Timeline node marker -->
                             <div class="absolute left-[-42px] top-1 w-5 h-5 rounded-full border-4 border-bg-deep ring-1 ring-white/10 flex items-center justify-center"
                                  [ngClass]="{
                                    'bg-primary shadow-[0_0_15px_rgba(76,214,251,0.4)]': t.status === 'submitted',
                                    'bg-indigo-500': t.status === 'acknowledged',
                                    'bg-amber-500': t.status === 'in_progress',
                                    'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]': t.status === 'resolved'
                                  }">
                             </div>
                             
                             <div class="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                <div>
                                   <div class="flex items-center gap-3 mb-1">
                                     <span class="text-sm font-black text-white/90 uppercase tracking-tight">{{ t.status === 'in_progress' ? 'Rectification Initiated' : t.status }}</span>
                                     <span class="text-[10px] font-bold text-dim">{{ t.changed_at | date:'dd MMM, HH:mm' }}</span>
                                   </div>
                                   <p class="text-sm text-dim leading-relaxed max-w-xl">{{ t.note || 'Vector status shift confirmed by institutional authority.' }}</p>
                                </div>
                                <div class="hidden md:block text-right">
                                   <p class="label-md !text-[8px] mb-1">Authenticated By</p>
                                   <p class="text-[10px] font-bold text-primary/70">{{ t.changed_by || 'Sovereign AI' }}</p>
                                </div>
                             </div>
                          </div>
                        }
                      </div>

                      <!-- Summary Footer -->
                      <div class="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                         <div>
                            <p class="label-md !text-primary !tracking-widest mb-1">Current Sector Dept.</p>
                            <p class="text-sm font-bold text-white">{{ c.department | uppercase }} Authority</p>
                         </div>
                         <button class="btn-ghost !py-2 !px-4 !text-[8px] !rounded-md">Request Escalation</button>
                      </div>

                      <!-- AI Audit Report Section -->
                      @if (aiReport() && aiReport()?.summary) {
                        <div class="mt-8 p-8 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 reveal relative overflow-hidden">
                           <div class="absolute top-0 right-0 p-8 opacity-10">
                              <mat-icon class="!text-8xl">precision_manufacturing</mat-icon>
                           </div>
                           <div class="flex items-center gap-3 mb-6">
                              <div class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                              <h4 class="label-md !text-indigo-400">AI Resolution Audit</h4>
                              <span class="text-[10px] font-mono text-dim ml-auto">MATCH_QUALITY: {{ aiReport()?.quality_score }}%</span>
                           </div>

                           <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div>
                                 <p class="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Internal Summary</p>
                                 <p class="text-sm text-white/80 leading-relaxed">{{ aiReport()?.summary }}</p>
                                 
                                 <div class="mt-6">
                                    <p class="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Gap Intelligence</p>
                                    <p class="text-xs text-dim italic leading-relaxed">{{ aiReport()?.gap_analysis }}</p>
                                 </div>
                              </div>
                              <div class="space-y-6">
                                 <div>
                                    <p class="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Sentiment Vector</p>
                                    <span class="chip chip-primary !bg-indigo-500/10 !text-indigo-300">#{{ aiReport()?.sentiment }}</span>
                                 </div>
                                 <div>
                                    <p class="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Recommended Protocols</p>
                                    <p class="text-xs font-bold text-indigo-300/80">{{ aiReport()?.suggested_followup }}</p>
                                 </div>
                                 <div class="flex flex-wrap gap-2">
                                    @for (tag of aiReport()?.tags; track tag) {
                                      <span class="text-[9px] font-black text-primary/50 uppercase tracking-tighter">{{ tag }}</span>
                                    }
                                 </div>
                              </div>
                           </div>
                        </div>
                      }

                      <!-- Officer Verification Section -->
                      @if (resolution() && resolution()?.share_with_citizen) {
                        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div class="md:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                              <h4 class="label-md mb-6 flex items-center gap-2">
                                 <mat-icon class="text-emerald-500 scale-75">verified</mat-icon>
                                 Resolution Evidence
                              </h4>
                              
                              <div class="space-y-6">
                                 @if (resolution()?.transcription) {
                                   <div class="p-4 rounded-xl bg-black/20 border border-white/5">
                                      <p class="text-[10px] font-black text-dim uppercase mb-2">Officer Elaboration</p>
                                      <p class="text-sm text-white/90 leading-relaxed">{{ resolution()?.transcription }}</p>
                                   </div>
                                 }

                                 <div class="flex flex-wrap gap-4">
                                    @if (resolution()?.audio_url) {
                                      <div class="flex-1 min-w-[200px] p-4 rounded-xl bg-white/5 border border-white/5">
                                         <p class="text-[9px] font-bold text-dim uppercase mb-3 text-center">Audio Briefing</p>
                                         <audio [src]="resolution()?.audio_url || ''" controls class="w-full h-8"></audio>
                                      </div>
                                    }
                                    @if (resolution()?.video_url) {
                                      <div class="w-full p-4 rounded-xl bg-white/5 border border-white/5">
                                         <p class="text-[9px] font-bold text-dim uppercase mb-3">Video Verification</p>
                                         <video [src]="resolution()?.video_url || ''" controls class="w-full rounded-lg"></video>
                                      </div>
                                    }
                                 </div>
                              </div>
                           </div>

                           <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                              <h4 class="label-md mb-6">Field Proof</h4>
                              @if (resolution()?.photo_url) {
                                <img [src]="resolution()?.photo_url" class="w-full aspect-square object-cover rounded-xl border border-white/5 mb-4">
                              }
                              <div class="mt-auto pt-4 border-t border-white/5 space-y-2">
                                 <div class="flex justify-between items-center text-[10px]">
                                    <span class="text-dim">GPS MATCH</span>
                                    <span class="font-bold text-emerald-400">VERIFIED</span>
                                 </div>
                                 <div class="flex justify-between items-center text-[10px]">
                                    <span class="text-dim">TIMESTAMP</span>
                                    <span class="font-bold text-white/80">AUTHENTIC</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      }
                    }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class MyComplaintsComponent implements OnInit {
  complaints    = signal<any[]>([]);
  loading       = signal(true);
  expandedId    = signal<string | null>(null);
  timeline      = signal<TimelineEntry[]>([]);
  aiReport      = signal<AIReport | null>(null);
  resolution    = signal<ResolutionDetails | null>(null);
  timelineLoading = signal(false);

  constructor(private complaintSvc: ComplaintService) {}

  ngOnInit() {
    this.complaintSvc.mine().subscribe({
      next: (data: any[]) => { this.complaints.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  toggle(id: string) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(id);
    this.timelineLoading.set(true);
    this.aiReport.set(null);
    this.resolution.set(null);
    
    this.complaintSvc.getDetails(id).subscribe({
      next: (res) => { 
        this.timeline.set(res.timeline); 
        this.aiReport.set(res.ai_report || null);
        this.resolution.set(res.resolution || null);
        this.timelineLoading.set(false); 
      },
      error: () => this.timelineLoading.set(false)
    });
  }
}
