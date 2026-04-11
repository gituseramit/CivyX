import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintService } from '../../core/services/complaint.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-feed',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="min-h-screen pt-24 pb-12 px-6 md:px-10 lg:px-16 reveal">
      
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-12 flex flex-col items-center text-center">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-12 h-px bg-primary"></span>
            <span class="label-md text-primary font-black uppercase tracking-[0.3em]">Live Transparency</span>
            <span class="w-12 h-px bg-primary"></span>
          </div>
          <h1 class="display-md mb-4 uppercase tracking-tighter">Civic <span class="text-primary italic font-black">Pulse</span></h1>
          <p class="text-dim max-w-lg leading-relaxed font-medium">Real-time observational feed of municipal grievances and infrastructure status updates across the city.</p>
        </div>

        <!-- Feed Matrix -->
        <div class="space-y-6">
          @for (item of feed(); track item.id) {
            <div class="institutional-glass p-8 rounded-2xl border border-white/5 hover:border-primary/20 transition-all duration-500 group">
              <div class="flex flex-col md:flex-row gap-6">
                <!-- Status Icon -->
                <div class="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:glow-cyan transition-all duration-700">
                  <mat-icon class="!text-3xl" [ngClass]="{
                    'text-amber-500': item.status === 'submitted',
                    'text-primary': item.status === 'acknowledged' || item.status === 'in_progress',
                    'text-emerald-500': item.status === 'resolved',
                    'text-rose-500': item.status === 'escalated'
                  }">{{ getIcon(item.category) }}</mat-icon>
                </div>

                <div class="flex-1">
                  <div class="flex items-center justify-between mb-2">
                    <span class="label-md !text-[10px] uppercase font-black tracking-widest text-primary">{{ item.category }}</span>
                    <span class="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{{ item.created_at | date:'medium' }}</span>
                  </div>
                  <h3 class="text-xl font-black text-white mb-3 tracking-tight group-hover:text-primary transition-colors">{{ item.title }}</h3>
                  
                  <div class="flex flex-wrap items-center gap-4 mt-6">
                    <div class="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                      <mat-icon class="!text-xs text-dim">location_on</mat-icon>
                      <span class="text-[10px] font-bold text-white/60">{{ item.ward_name }}</span>
                    </div>
                    <div class="px-4 py-1.5 rounded-full border flex items-center gap-2" [ngClass]="{
                      'bg-amber-500/10 border-amber-500/20 text-amber-500': item.status === 'submitted',
                      'bg-primary/10 border-primary/20 text-primary': item.status === 'acknowledged' || item.status === 'in_progress',
                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-500': item.status === 'resolved',
                      'bg-rose-500/10 border-rose-500/20 text-rose-500': item.status === 'escalated'
                    }">
                      <div class="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft"></div>
                      <span class="text-[9px] font-black uppercase tracking-widest">{{ item.status }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="text-center py-24 institutional-glass rounded-2xl border border-white/5">
              <mat-icon class="!text-6xl text-white/10 mb-6">sensors</mat-icon>
              <p class="label-md !text-white/30 tracking-widest uppercase">Awaiting incoming intelligence streams...</p>
            </div>
          }
        </div>

        <div class="mt-16 flex justify-center">
          <a routerLink="/" class="btn-ghost !text-[9px] uppercase tracking-[0.2em] flex items-center gap-3">
             <mat-icon class="text-xs">arrow_back</mat-icon> Return to Command Centre
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-dim { color: rgba(214, 227, 252, 0.5); }
    .animate-pulse-soft {
      animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse-soft {
      0%, 100% { opacity: 1; }
      50% { opacity: .4; }
    }
  `]
})
export class PublicFeedComponent implements OnInit {
  feed = signal<any[]>([]);

  constructor(private complaintSvc: ComplaintService) {}

  ngOnInit() {
    this.loadFeed();
    // Poll every 30 seconds for "Live" feel
    setInterval(() => this.loadFeed(), 30000);
  }

  loadFeed() {
    this.complaintSvc.getPublicFeed().subscribe(data => {
      this.feed.set(data);
    });
  }

  getIcon(cat: string): string {
    const icons: any = {
      'road': 'add_road',
      'water': 'water_drop',
      'power': 'electric_bolt',
      'sanitation': 'delete_outline',
      'drainage': 'waves',
      'streetlight': 'lightbulb',
      'safety': 'security',
      'corruption': 'gavel'
    };
    return icons[cat.toLowerCase()] || 'description';
  }
}
