import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintService, Complaint } from '../../core/services/complaint.service';
import { WardService, Ward } from '../../core/services/ward.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-officer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatMenuModule, MatSnackBarModule],
  template: `
    <div class="min-h-screen pt-24 pb-12 px-6 md:px-10 lg:px-16 reveal">
      
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
                          <div class="flex items-center gap-3 mb-1">
                             <span class="font-bold text-white text-sm max-w-[240px] truncate">{{ c.title }}</span>
                             @if (c.ai_classified) {
                               <span class="text-primary material-symbols-outlined text-sm glow-cyan" title="AI Verified">auto_awesome</span>
                             }
                          </div>
                          <div class="text-[10px] font-mono text-dim">CASE_ID: {{ c.id.slice(0,8).toUpperCase() }}</div>
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
                              <button mat-menu-item (click)="updateStatus(c.id, 'resolved')" [disabled]="c.status === 'resolved'" class="!text-[10px] font-bold uppercase tracking-widest py-3">
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

  filterWard = '';
  filterStatus = '';
  filterCategory = '';

  constructor(
    private complaintService: ComplaintService,
    private wardService: WardService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.refreshAll();
    this.wardService.list().subscribe(w => this.wards.set(w));
  }

  refreshAll() {
    this.loadStats();
    this.loadComplaints();
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
}
