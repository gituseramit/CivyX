import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ComplaintService, Complaint } from '../../core/services/complaint.service';
import { WardService, Ward } from '../../core/services/ward.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GeoService } from '../../core/services/geo.service';
import { VoiceService } from '../../core/services/voice.service';
import { GovtBadgeComponent } from '../../shared/components/govt-badge/govt-badge.component';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatMenuModule, MatSnackBarModule, GovtBadgeComponent],
  template: `
    <div class="min-h-screen pt-24 pb-12 px-6 md:px-10 lg:px-16 reveal">
      <div class="mb-4 flex justify-end" *ngIf="isVerified()">
         <app-govt-badge [officerName]="userName()" [verificationId]="verificationId()"></app-govt-badge>
      </div>
      
      <!-- Page Header -->
      <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-3">
             <span class="w-10 h-px bg-primary"></span>
             <span class="label-md text-primary">Command Centre</span>
          </div>
          <h1 class="display-sm mb-2">Officer <span class="text-primary italic">Command</span></h1>
          <p class="text-dim text-base max-w-xl">Real-time planetary intelligence and civic engagement metrics for high-priority urban sectors.</p>
        </div>
        <div class="flex items-center gap-4">
           <button (click)="refreshAll()" class="btn-ghost !px-5 !py-3 flex items-center gap-2">
              <mat-icon class="text-lg">refresh</mat-icon> Ingest Data
           </button>
        </div>
      </div>

      <!-- High-Density Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div class="institutional-glass p-8 rounded-xl border-l-4 border-primary">
          <p class="label-md mb-2">Total Dossiers</p>
          <div class="text-4xl font-black text-white mb-1">{{ stats().total || 0 }}</div>
          <p class="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Aggregate Archive</p>
        </div>

        <div class="institutional-glass p-8 rounded-xl border-l-4 border-amber-500">
          <p class="label-md mb-2">Pending Protocol</p>
          <div class="text-4xl font-black text-amber-500 mb-1">{{ stats().pending || 0 }}</div>
          <p class="text-[10px] font-bold text-amber-500/40 uppercase tracking-widest">Awaiting Verification</p>
        </div>

        <div class="institutional-glass p-8 rounded-xl border-l-4 border-indigo-400">
          <p class="label-md mb-2">In Progress</p>
          <div class="text-4xl font-black text-indigo-400 mb-1">{{ stats().in_progress || 0 }}</div>
          <p class="text-[10px] font-bold text-indigo-400/40 uppercase tracking-widest">Active Resolution</p>
        </div>

        <div class="institutional-glass p-8 rounded-xl border-l-4 border-emerald-500">
          <p class="label-md mb-2">Resolved Flux</p>
          <div class="text-4xl font-black text-emerald-500 mb-1">{{ stats().resolved_today || 0 }}</div>
          <p class="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">Total Rectified</p>
        </div>
      </div>

      <!-- Filters & Active Intelligence Area -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Sidebar Filters -->
        <div class="lg:col-span-1 space-y-6">
           <div class="institutional-glass p-6 rounded-xl">
              <h3 class="label-md mb-6 border-b border-white/5 pb-4">Deep Filters</h3>
              
              <div class="space-y-6">
                 <div>
                    <label class="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Spatial Sector</label>
                    <select [(ngModel)]="filterWard" (change)="loadComplaints()" class="data-portal-input !py-2.5 !text-[11px] appearance-none cursor-pointer">
                      <option value="">All City Wards</option>
                      @for (w of wards(); track w.id) {
                        <option [value]="w.id">{{ w.name }}</option>
                      }
                    </select>
                 </div>

                 <div>
                    <label class="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Status Vector</label>
                    <select [(ngModel)]="filterStatus" (change)="loadComplaints()" class="data-portal-input !py-2.5 !text-[11px] appearance-none cursor-pointer">
                      <option value="">All Statuses</option>
                      <option value="submitted">Submitted</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                 </div>

                 <div>
                    <label class="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-2">Issue Category</label>
                    <select [(ngModel)]="filterCategory" (change)="loadComplaints()" class="data-portal-input !py-2.5 !text-[11px] appearance-none cursor-pointer">
                      <option value="">All Categories</option>
                      <option value="roads">Roads</option>
                      <option value="water">Water Supply</option>
                      <option value="sanitation">Sanitation</option>
                      <option value="power">Electricity</option>
                      <option value="safety">Public Safety</option>
                    </select>
                 </div>
              </div>
           </div>

           <!-- AI Status -->
           <div class="p-6 rounded-xl bg-primary/5 border border-primary/10">
              <div class="flex items-center gap-3 mb-4">
                 <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                 <span class="text-[9px] font-black text-primary uppercase tracking-widest">AI Hub Status: Nominal</span>
              </div>
              <p class="text-[11px] text-white/60 leading-relaxed font-medium">Automatic classification engine is performing at 98.4% accuracy across all sectors.</p>
           </div>
        </div>

        <!-- Complaints Stream -->
        <div class="lg:col-span-3">
           
           <!-- AI Daily Digest Glass Card -->
           @if (aiDigest()) {
             <div class="mb-8 institutional-glass p-8 rounded-3xl border border-primary/20 bg-primary/5 relative overflow-hidden reveal">
               <div class="absolute top-0 right-0 p-4 opacity-10">
                 <mat-icon class="!text-7xl">psychology</mat-icon>
               </div>
               <div class="flex items-start gap-6">
                 <div class="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                   <mat-icon class="text-primary">auto_awesome</mat-icon>
                 </div>
                 <div>
                   <span class="label-md !text-[9px] text-primary/70 uppercase tracking-[0.3em] font-black mb-2 block">Sovereign Intelligence Briefing</span>
                   <p class="text-xl font-bold text-white leading-relaxed tracking-tight">{{ aiDigest() }}</p>
                 </div>
               </div>
             </div>
           }

           <div class="institutional-glass rounded-xl overflow-hidden min-h-[500px]">
              <div class="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <h2 class="headline-sm">Active Intelligence Stream</h2>
                 <span class="label-md !text-[9px] px-3 py-1 rounded bg-white/[0.05] border border-white/10">{{ complaints().length }} Records Found</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-white/[0.05]">
                      <th class="px-8 py-5 label-md !text-[9px]">Grievance Details</th>
                      <th class="px-8 py-5 label-md !text-[9px]">Spatial Vector</th>
                      <th class="px-8 py-5 label-md !text-[9px]">Prioritization</th>
                      <th class="px-8 py-5 label-md !text-[9px]">Status Vector</th>
                      <th class="px-8 py-5 label-md !text-[9px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of complaints(); track c.id) {
                      <tr class="border-b border-white/[0.02] hover:bg-white/[0.03] transition-all">
                         <td class="px-8 py-6">
                           <div class="flex items-center justify-between mb-1">
                             <div class="flex items-center gap-3">
                               <span class="font-bold text-white text-sm max-w-[240px] truncate">{{ c.title }}</span>
                               @if (c.ai_classified) {
                                 <mat-icon class="text-primary text-sm glow-cyan" title="AI Verified">auto_awesome</mat-icon>
                               }
                             </div>
                             @if (c.is_escalated) {
                               <span class="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[7px] font-black uppercase tracking-widest animate-pulse">ESCALATED</span>
                             }
                           </div>
                           <div class="flex items-center gap-4">
                             <div class="text-[10px] font-mono text-dim uppercase">CASE_ID: {{ c.id.slice(0,8).toUpperCase() }}</div>
                             @if (c.duplicate_count > 0) {
                               <span class="text-[9px] text-amber-500 font-bold tracking-tighter">🔥 {{ c.duplicate_count }} Linked Reports</span>
                             }
                           </div>
                         </td>
                        <td class="px-8 py-6">
                           <div class="text-xs font-bold text-white/80 mb-1">{{ c.ward_name || 'Global' }}</div>
                           <div class="text-[10px] text-dim uppercase tracking-tighter">{{ c.category }} Division</div>
                        </td>
                        <td class="px-8 py-6">
                           <div class="flex gap-0.5">
                             @for (i of [1,2,3,4,5]; track i) {
                               <div class="w-1 h-3 rounded-full" 
                                    [style.background]="i <= c.severity ? '#4CD6FB' : 'rgba(255,255,255,0.05)'"
                                    [style.box-shadow]="i <= c.severity ? '0 0 8px rgba(76,214,251,0.3)' : 'none'"
                                    [style.opacity]="i <= c.severity ? (0.2 * i + 0.4) : 1"></div>
                             }
                           </div>
                        </td>
                        <td class="px-8 py-6">
                          <span class="chip" [ngClass]="{
                            'chip-primary': c.status === 'submitted',
                            'chip-indigo': c.status === 'acknowledged',
                            'chip-amber': c.status === 'in_progress',
                            'chip-emerald': c.status === 'resolved'
                          }">{{ c.status === 'in_progress' ? 'Rectifying' : c.status === 'acknowledged' ? 'Intelligence Received' : c.status }}</span>
                        </td>
                        <td class="px-8 py-6">
                          <button [matMenuTriggerFor]="menu" class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-all text-white/40">
                            <mat-icon class="text-lg">more_vert</mat-icon>
                          </button>
                          <mat-menu #menu="matMenu" class="institutional-glass-menu">
                              <button mat-menu-item (click)="updateStatus(c.id, 'acknowledged')" [disabled]="c.status !== 'submitted'" class="!text-[10px] font-bold uppercase tracking-widest py-3">
                                  <mat-icon class="text-primary scale-75">assignment_turned_in</mat-icon> Acknowledge
                              </button>
                              <button mat-menu-item (click)="updateStatus(c.id, 'in_progress')" [disabled]="c.status === 'resolved'" class="!text-[10px] font-bold uppercase tracking-widest py-3">
                                  <mat-icon class="text-indigo-400 scale-75">engineering</mat-icon> Rectify Issue
                              </button>
                              <button mat-menu-item (click)="openResolutionModal(c)" [disabled]="c.status === 'resolved'" class="!text-[10px] font-bold uppercase tracking-widest py-3">
                                  <mat-icon class="text-emerald-500 scale-75">verified</mat-icon> Final Resolution
                              </button>
                          </mat-menu>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                         <td colspan="5" class="px-8 py-32 text-center">
                            <mat-icon class="!text-6xl mb-6 text-primary opacity-20">biotech</mat-icon>
                            <p class="text-dim text-sm italic">No intelligence stream detected for the chosen filtered coordinates.</p>
                         </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>

      <!-- Resolution Protocol Modal -->
      @if (showResolutionModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 reveal">
          <div class="institutional-glass w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/20 shadow-2xl overflow-hidden flex flex-col">
            
            <!-- Modal Header -->
            <div class="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-primary/5">
              <div>
                <h2 class="headline-sm">Resolution Protocol</h2>
                <p class="text-[10px] font-bold text-primary uppercase tracking-widest">Case: {{ activeComplaint()?.id?.slice(0,8) }}</p>
              </div>
              <button (click)="closeResolutionModal()" class="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="p-8 space-y-8">
              
              <!-- 1. Spatial Verification -->
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <h3 class="label-md">Spatial Verification (Photo & GPS)</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="aspect-video bg-black/40 rounded-xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-center group">
                    @if (capturedPhoto()) {
                      <img [src]="capturedPhoto()" class="w-full h-full object-cover">
                      <button (click)="capturedPhoto.set(null)" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                         <mat-icon class="scale-75">delete</mat-icon>
                      </button>
                    } @else {
                      <mat-icon class="!text-4xl text-white/20 mb-3">photo_camera</mat-icon>
                      <button (click)="capturePhoto()" class="btn-primary !px-6 !py-2 text-[10px]">Capture Evidence</button>
                    }
                  </div>
                  
                  <div class="space-y-4">
                    <div class="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <p class="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">GPS telemetry</p>
                      @if (currentCoords()) {
                        <div class="text-xs font-mono text-emerald-400">LAT: {{ currentCoords()?.lat?.toFixed(6) }}</div>
                        <div class="text-xs font-mono text-emerald-400">LNG: {{ currentCoords()?.lng?.toFixed(6) }}</div>
                        @if (distance() !== null) {
                          <div class="mt-2 text-[10px] font-bold" [class.text-red-400]="distance()! > 500" [class.text-emerald-400]="distance()! <= 500">
                             Distance: {{ distance()?.toFixed(1) }}m from site
                             @if (distance()! > 500) { <span class="block text-[8px] uppercase tracking-tighter opacity-70">Warning: Out of operational radius</span> }
                          </div>
                        }
                      } @else {
                        <p class="text-[10px] italic text-dim">Acquiring spatial satellite lock...</p>
                      }
                    </div>
                    <div class="flex items-center gap-3">
                       <input type="checkbox" [(ngModel)]="resForm.mismatch" id="mismatch" class="opacity-1 absolute">
                       <label for="mismatch" class="flex items-center gap-2 cursor-pointer group">
                          <div class="w-5 h-5 rounded border-2 border-white/10 flex items-center justify-center group-hover:border-primary transition-all" [class.bg-primary]="resForm.mismatch" [class.border-primary]="resForm.mismatch">
                             @if (resForm.mismatch) { <mat-icon class="text-white">check</mat-icon> }
                          </div>
                          <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest">Flag Location Mismatch</span>
                       </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. Recorded Elaboration -->
              <div class="space-y-4 border-t border-white/5 pt-8">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-indigo-400/10 flex items-center justify-center text-indigo-400 font-bold">2</div>
                  <h3 class="label-md">Recorded Elaboration</h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div class="p-6 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
                      @if (isRecordingMedia()) {
                        <div class="w-3 rounded-full bg-red-500 h-3 animate-ping mb-4"></div>
                        <div class="text-2xl font-black mb-4 font-mono">{{ displayTime() }}</div>
                        <button (click)="stopRecording()" class="btn-ghost !border-red-500/20 text-red-500 !px-8">Stop Recording</button>
                      } @else if (recordedUrl()) {
                        <video *ngIf="mediaType() === 'video'" [src]="recordedUrl()" controls class="w-full rounded-lg mb-4"></video>
                        <audio *ngIf="mediaType() === 'audio'" [src]="recordedUrl()" controls class="w-full mb-4"></audio>
                        <div class="flex gap-2">
                          <button (click)="resetRecording()" class="btn-ghost !px-4 !py-2 text-[9px] uppercase">Discard</button>
                        </div>
                      } @else {
                        <div class="flex gap-4">
                           <button (click)="startRecording('audio')" class="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-all text-white/40 hover:text-primary">
                              <mat-icon class="!text-3xl">mic</mat-icon>
                              <span class="text-[9px] font-black uppercase">Audio</span>
                           </button>
                           <button (click)="startRecording('video')" class="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-all text-white/40 hover:text-indigo-400">
                              <mat-icon class="!text-3xl">videocam</mat-icon>
                              <span class="text-[9px] font-black uppercase">Video View</span>
                           </button>
                        </div>
                      }
                   </div>

                   <div class="space-y-4">
                      <label class="text-[10px] font-black text-white/40 uppercase tracking-widest block">Resolution Intelligence Note</label>
                      <textarea [(ngModel)]="resForm.note" placeholder="Strategic detailed notes on resolution process..." class="data-portal-input !h-[120px] resize-none"></textarea>
                      <div class="flex items-center gap-3">
                        <input type="checkbox" [(ngModel)]="resForm.shareWithCitizen" id="share" class="opacity-1 absolute">
                        <label for="share" class="flex items-center gap-2 cursor-pointer group">
                           <div class="w-5 h-5 rounded border-2 border-white/10 flex items-center justify-center group-hover:border-primary transition-all" [class.bg-primary]="resForm.shareWithCitizen" [class.border-primary]="resForm.shareWithCitizen">
                              @if (resForm.shareWithCitizen) { <mat-icon class="text-white">check</mat-icon> }
                           </div>
                           <span class="text-[10px] font-bold text-white/60 uppercase tracking-widest">Share Media with Citizen</span>
                        </label>
                     </div>
                   </div>
                </div>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="px-8 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
               <button (click)="closeResolutionModal()" class="btn-ghost !px-6">Cancel Protocol</button>
               <button (click)="submitResolution()" [disabled]="!canSubmitResolution()" class="btn-primary !px-10 flex items-center gap-2">
                  <mat-icon class="text-lg">verified</mat-icon> Commit Resolution
               </button>
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep .institutional-glass-menu {
      background: rgba(13, 25, 41, 0.95) !important;
      backdrop-filter: blur(20px) !important;
      border: 1px solid rgba(76, 214, 251, 0.1) !important;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
    }
  `]
})
export class OfficerDashboardComponent implements OnInit {
  stats = signal<any>({});
  complaints = signal<any[]>([]);
  wards = signal<Ward[]>([]);
  aiDigest = signal<string>('');
  loadingDigest = signal<boolean>(true);

  filterWard = '';
  filterStatus = '';
  filterCategory = '';
  userName = signal('');
  verificationId = signal('');
  isVerified = signal(false);

  // Resolution Modal State
  showResolutionModal = signal(false);
  activeComplaint = signal<any>(null);
  capturedPhoto = signal<string | null>(null);
  currentCoords = signal<{lat: number, lng: number} | null>(null);
  distance = signal<number | null>(null);
  
  isRecordingMedia = signal(false);
  recordedUrl = signal<string | null>(null);
  mediaType = signal<'audio' | 'video'>('audio');
  recordedBlob = signal<Blob | null>(null);
  displayTime = signal('00:00');
  timerInterval: any;

  resForm = {
    note: '',
    shareWithCitizen: true,
    mismatch: false,
    transcription: ''
  };

  constructor(
    private complaintService: ComplaintService,
    private wardService: WardService,
    private geoService: GeoService,
    private voiceService: VoiceService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.refreshAll();
    const user = JSON.parse(localStorage.getItem('civyx_user') || '{}');
    this.userName.set(user.name || 'Official');
    this.verificationId.set(user.verification_id || '');
    this.isVerified.set(user.verification_status === 'APPROVED');
    this.wardService.list().subscribe(w => this.wards.set(w));
  }

  refreshAll() {
    this.loadStats();
    this.loadComplaints();
    this.loadDigest();
  }

  loadDigest() {
    this.complaintService.getOfficerDigest().subscribe({
      next: (res) => {
        this.aiDigest.set(res.digest);
        this.loadingDigest.set(false);
      },
      error: () => this.loadingDigest.set(false)
    });
  }

  loadStats() {
    this.complaintService.officerStats().subscribe(s => this.stats.set(s));
  }

  loadComplaints() {
    this.complaintService.officerList({
      ward_id: this.filterWard,
      status: this.filterStatus,
      category: this.filterCategory
    }).subscribe(c => this.complaints.set(c));
  }

  updateStatus(id: string, newStatus: string) {
    this.complaintService.updateStatus(id, newStatus).subscribe({
      next: () => {
        this.snackBar.open(`Intelligence Vector Updated to ${newStatus.toUpperCase()}`, 'OK', { duration: 3000 });
        this.refreshAll();
      },
      error: () => this.snackBar.open('Error Updating Status Vector.', 'Close', { duration: 3000 })
    });
  }

  // --- Resolution Protocol ---

  openResolutionModal(complaint: any) {
    this.activeComplaint.set(complaint);
    this.showResolutionModal.set(true);
    this.resForm = { note: '', shareWithCitizen: true, mismatch: false, transcription: '' };
    this.capturedPhoto.set(null);
    this.recordedUrl.set(null);
    this.recordedBlob.set(null);
    this.currentCoords.set(null);
    this.distance.set(null);

    // Initial GPS Lock
    this.geoService.getCurrentPosition().then(pos => {
      this.currentCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      if (complaint.lat && complaint.lng) {
        this.distance.set(this.geoService.getDistance(pos.coords.latitude, pos.coords.longitude, complaint.lat, complaint.lng));
      }
    });
  }

  closeResolutionModal() {
    this.showResolutionModal.set(false);
    this.resetRecording();
  }

  async capturePhoto() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      await new Promise(r => setTimeout(r, 1000)); // wait for camera warm down
      
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        this.capturedPhoto.set(canvas.toDataURL('image/jpeg'));
      }
      
      stream.getTracks().forEach(t => t.stop());
    } catch (err) {
      this.snackBar.open('Camera Access Denied.', 'OK');
    }
  }

  async startRecording(type: 'audio' | 'video') {
    this.mediaType.set(type);
    this.isRecordingMedia.set(true);
    let seconds = 0;
    this.timerInterval = setInterval(() => {
       seconds++;
       const m = Math.floor(seconds / 60).toString().padStart(2, '0');
       const s = (seconds % 60).toString().padStart(2, '0');
       this.displayTime.set(`${m}:${s}`);
       if (seconds >= 120) this.stopRecording();
    }, 1000);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
    const recorder = new MediaRecorder(stream);
    const chunks: any[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
       const blob = new Blob(chunks, { type: type === 'audio' ? 'audio/webm' : 'video/webm' });
       this.recordedBlob.set(blob);
       this.recordedUrl.set(URL.createObjectURL(blob));
       stream.getTracks().forEach(t => t.stop());
    };
    recorder.start();
    (window as any)._activeRecorder = recorder;
  }

  stopRecording() {
    clearInterval(this.timerInterval);
    const recorder = (window as any)._activeRecorder;
    if (recorder) recorder.stop();
    this.isRecordingMedia.set(false);
  }

  resetRecording() {
    this.recordedUrl.set(null);
    this.recordedBlob.set(null);
    this.displayTime.set('00:00');
  }

  canSubmitResolution() {
    return this.capturedPhoto() && (this.resForm.note.length > 5 || this.recordedBlob());
  }

  async submitResolution() {
    const complaint = this.activeComplaint();
    const data = {
      ...this.resForm,
      lat: this.currentCoords()?.lat,
      lng: this.currentCoords()?.lng,
      photo: this.capturedPhoto() ? await (await fetch(this.capturedPhoto()!)).blob() : null,
      audio: this.mediaType() === 'audio' ? this.recordedBlob() : null,
      video: this.mediaType() === 'video' ? this.recordedBlob() : null
    };

    this.complaintService.resolveComplaint(complaint.id, data).subscribe({
      next: () => {
        this.snackBar.open('Resolution Committed with Proof.', 'OK');
        this.closeResolutionModal();
        this.refreshAll();
      },
      error: () => this.snackBar.open('Failed to Commit Resolution.', 'OK')
    });
  }
}
