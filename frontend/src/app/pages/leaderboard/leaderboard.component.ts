import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintService } from '../../core/services/complaint.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="min-h-screen pt-24 pb-12 px-6 md:px-10 lg:px-16 reveal">
      
      <div class="max-w-5xl mx-auto">
        <!-- Header -->
        <div class="mb-16">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-12 h-px bg-primary"></span>
            <span class="label-md text-primary font-black uppercase tracking-[0.3em]">Institutional Accountability</span>
          </div>
          <h1 class="display-md mb-4 uppercase tracking-tighter">Officer <span class="text-primary italic font-black">Merit</span></h1>
          <p class="text-dim max-w-lg leading-relaxed font-medium italic">Public monthly ranking of departmental intelligence officers based on resolution velocity and citizen satisfaction metrics.</p>
        </div>

        <!-- Leaderboard Matrix -->
        <div class="institutional-glass rounded-3xl border border-white/5 p-2 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/5 bg-white/[0.02]">
                <th class="py-6 px-8 label-md !text-[9px] tracking-widest text-primary">RANK</th>
                <th class="py-6 px-8 label-md !text-[9px] tracking-widest text-dim">OFFICER IDENTITY</th>
                <th class="py-6 px-8 label-md !text-[9px] tracking-widest text-dim text-center">RESOLVED</th>
                <th class="py-6 px-8 label-md !text-[9px] tracking-widest text-dim text-center">VELOCITY (AVG)</th>
                <th class="py-6 px-8 label-md !text-[9px] tracking-widest text-dim text-right">MERIT SCORE</th>
              </tr>
            </thead>
            <tbody>
              @for (officer of rankings(); track officer.name; let i = $index) {
                <tr class="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0">
                  <td class="py-8 px-8">
                    <div class="flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg" 
                         [ngClass]="{
                           'bg-amber-500/10 text-amber-500 glow-amber': i === 0,
                           'bg-slate-300/10 text-slate-300': i === 1,
                           'bg-orange-400/10 text-orange-400': i === 2,
                           'text-dim': i > 2
                         }">
                      {{ i + 1 }}
                    </div>
                  </td>
                  <td class="py-8 px-8">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <mat-icon class="text-primary">person</mat-icon>
                      </div>
                      <div>
                        <div class="text-lg font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight">{{ officer.name }}</div>
                        <div class="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-1">Sovereign Authority</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-8 px-8 text-center">
                    <div class="text-2xl font-black text-white">{{ officer.resolved_count }}</div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-tighter">Complaints</div>
                  </td>
                  <td class="py-8 px-8 text-center text-dim font-black italic">
                    {{ officer.avg_hours | number:'1.1-1' || '0.0' }} Hours
                  </td>
                  <td class="py-8 px-8 text-right">
                    <div class="text-2xl font-black text-primary">{{ officer.rate | number:'1.0-0' }}%</div>
                    <div class="h-1 w-24 bg-white/5 rounded-full mt-2 ml-auto overflow-hidden">
                      <div class="h-full bg-primary shadow-[0_0_10px_rgba(76,214,251,0.5)]" [style.width.%]="officer.rate"></div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (rankings().length === 0) {
            <div class="py-24 text-center">
              <mat-icon class="!text-6xl text-white/5 mb-4">analytics</mat-icon>
              <p class="label-md !text-white/20 tracking-widest uppercase">Initializing metric aggregation...</p>
            </div>
          }
        </div>

        <div class="mt-16 flex justify-between items-center opacity-40 grayscale group hover:grayscale-0 transition-all">
           <div class="flex items-center gap-6">
             <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <mat-icon class="text-amber-500">workspace_premium</mat-icon>
             </div>
             <p class="text-[9px] font-black tracking-[0.2em] uppercase leading-relaxed text-white">Monthly Gold Badge<br><span class="text-amber-500 italic">Top 1% Efficiency</span></p>
           </div>
           <a routerLink="/" class="btn-ghost !text-[9px] uppercase tracking-[0.2em]">Exit Matrix</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-dim { color: rgba(214, 227, 252, 0.5); }
    .glow-amber { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3)); }
  `]
})
export class LeaderboardComponent implements OnInit {
  rankings = signal<any[]>([]);

  constructor(private complaintSvc: ComplaintService) {}

  ngOnInit() {
    this.complaintSvc.getLeaderboard().subscribe(data => {
      this.rankings.set(data);
    });
  }
}
