import { Component, OnInit, AfterViewInit, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WardService, Ward } from '../../core/services/ward.service';
import { ComplaintService } from '../../core/services/complaint.service';
import * as L from 'leaflet';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';


Chart.register(...registerables);

@Component({
  selector: 'app-ward-map',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  template: `
    <div class="flex h-screen overflow-hidden reveal">
      
      <!-- Institutional Sidebar -->
      <div class="w-full md:w-[450px] h-full institutional-glass border-r border-white/5 p-10 flex flex-col gap-10 overflow-y-auto z-50">
        
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-3">
             <span class="w-10 h-px bg-primary"></span>
             <span class="label-md text-primary font-black uppercase tracking-[0.2em]">Spatial Intelligence</span>
          </div>
          <h1 class="display-sm mb-1 uppercase tracking-tight">Ward <span class="text-primary italic font-black">Matrix</span></h1>
          <p class="text-[10px] text-dim font-black uppercase tracking-[0.25em]">Sovereign Urban Monitoring</p>
        </div>

        @if (selectedWard()) {
          <div class="reveal">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-3xl font-black text-white tracking-tight">{{ selectedWard()?.name }}</h2>
              <div class="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center glow-cyan">
                <span class="label-md !text-[7px] !text-primary/70 mb-0.5">SCORE</span>
                <span class="text-2xl font-black text-primary leading-none">{{ selectedWard()?.health_score }}</span>
              </div>
            </div>
            <p class="text-sm font-medium text-dim mb-10">{{ selectedWard()?.city }} Municipal Authority</p>

            <!-- Metrics Tier -->
            <div class="grid grid-cols-2 gap-4 mb-10">
              <div class="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <p class="label-md !text-[8px] mb-2 tracking-widest text-white/40">Active Dossiers</p>
                <div class="text-3xl font-black text-white">{{ wardStats()?.total || 0 }}</div>
              </div>
              <div class="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <p class="label-md !text-[8px] mb-2 tracking-widest text-white/40">Critical Delta</p>
                <div class="text-3xl font-black text-rose-500">{{ wardStats()?.pending || 0 }}</div>
              </div>
              <div class="p-6 rounded-xl bg-primary/5 border border-primary/10 col-span-2">
                <div class="flex justify-between items-end mb-3">
                  <p class="label-md !text-[8px] !text-primary">Sovereign Resolution Scale</p>
                  <span class="font-black text-primary text-sm">{{ ((wardStats()?.resolved / (wardStats()?.total || 1)) * 100) | number:'1.0-0' }}%</span>
                </div>
                <div class="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(76,214,251,0.5)]" 
                        [style.width.%]="(wardStats()?.resolved / (wardStats()?.total || 1)) * 100"></div>
                </div>
              </div>
            </div>

            <!-- Infrastructural Distribution Chart -->
            <div class="p-6 rounded-xl bg-white/[0.01] border border-white/[0.03]">
               <h3 class="label-md mb-8 tracking-[0.2em] text-center text-white/30">Intelligence Distribution</h3>
               <div class="h-[260px] relative">
                 <canvas #chartCanvas></canvas>
               </div>
            </div>
          </div>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center text-center px-10">
            <div class="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-8 border border-primary/10">
               <mat-icon class="!text-4xl text-primary animate-pulse-soft">explore</mat-icon>
            </div>
            <p class="label-md !text-[11px] leading-relaxed max-w-[240px] !text-white/40">Select a spatial coordinate on the matrix to ingest ward health metrics.</p>
          </div>
        }

        <!-- Legend Tier -->
        <div class="mt-auto pt-8 border-t border-white/5 space-y-4">
           <div class="flex items-center gap-4">
             <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> 
             <span class="label-md !text-[8px] tracking-[0.15em]">Optimal Operational State (80-100)</span>
           </div>
           <div class="flex items-center gap-4">
             <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div> 
             <span class="label-md !text-[8px] tracking-[0.15em]">Maintenance Threshold (60-79)</span>
           </div>
           <div class="flex items-center gap-4">
             <div class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div> 
             <span class="label-md !text-[8px] tracking-[0.15em]">Critical Integrity Failure (0-59)</span>
           </div>
        </div>
      </div>

      <!-- Matrix Container (Map) -->
      <div id="map" class="flex-1 relative bg-[#04080e]">
         <div class="absolute inset-0 bg-primary/5 pointer-events-none z-[40]"></div>
         
         <div class="absolute top-8 left-8 z-[100] flex flex-col gap-4">
           <button (click)="toggleHeatmap()" class="btn-ghost !py-2.5 !px-5 !text-[9px] flex items-center gap-3" 
                   [ngClass]="{'bg-primary/20 border-primary/40': heatmapEnabled()}">
             <mat-icon class="text-xs">{{ heatmapEnabled() ? 'visibility' : 'local_fire_department' }}</mat-icon>
             {{ heatmapEnabled() ? 'DISABLE HEATMAP' : 'ACTIVATE SEVERITY HEATMAP' }}
           </button>
         </div>

         <a routerLink="/" class="absolute top-8 right-8 z-[100] btn-ghost !py-2.5 !px-5 !text-[9px] flex items-center gap-3">
           <mat-icon class="text-sm">arrow_back</mat-icon> DISCONNECT MATRIX
         </a>
      </div>
    </div>
  `,
  styles: [`
    #map { z-index: 10; }
    :host ::ng-deep .map-tiles {
       filter: brightness(0.4) invert(1) contrast(3) hue-rotate(170deg) saturate(0.3) brightness(1.2) !important;
    }
    :host ::ng-deep .leaflet-container {
       background: #061425 !important;
    }
    :host ::ng-deep .leaflet-marker-icon {
      border: 2px solid #fff !important;
      border-radius: 99px !important;
      box-shadow: 0 0 20px rgba(0,0,0,0.8) !important;
    }
  `]
})
export class WardMapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  selectedWard = signal<Ward | null>(null);
  wardStats = signal<any>(null);
  heatmapEnabled = signal<boolean>(false);
  private heatLayer: any = null;
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor(private wardService: WardService, private complaintSvc: ComplaintService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
    this.loadWards();
  }

  private initMap() {
    this.map = L.map('map', {
      center: [12.9716, 77.5946],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles'
    }).addTo(this.map);
  }

  private loadWards() {
    this.wardService.list().subscribe(wards => {
      wards.forEach(w => {
        const marker = L.circleMarker([w.lat, w.lng], {
          radius: 14 + (w.health_score / 15),
          fillColor: w.color,
          fillOpacity: 0.8,
          color: 'white',
          weight: 2
        }).addTo(this.map);

        marker.on('click', () => {
          this.onWardClick(w);
        });
      });
    });
  }

  toggleHeatmap() {
    this.heatmapEnabled.set(!this.heatmapEnabled());
    if (this.heatmapEnabled()) {
      this.complaintSvc.list().subscribe(complaints => {
        const heatPoints = complaints
          .filter(c => c.lat && c.lng)
          .map(c => [c.lat, c.lng, c.severity * 0.2]); // intensity based on severity
        
        this.heatLayer = (L as any).heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(this.map);
      });
    } else {
      if (this.heatLayer) {
        this.map.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }
    }
  }

  private onWardClick(ward: Ward) {
    this.selectedWard.set(ward);
    this.wardService.getStats(ward.id).subscribe((stats: any) => {
      this.wardStats.set(stats);
      this.updateChart(stats.categories);
    });
  }

  private updateChart(categories: any[]) {
    if (this.chart) { this.chart.destroy(); }
    if (!this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories.map(c => c.category),
        datasets: [{
          data: categories.map(c => c.count),
          backgroundColor: [
            '#4CD6FB', '#ADC8F5', '#1E2A3D', '#0F1C2E', '#293548'
          ],
          borderColor: 'rgba(255,255,255,0.05)',
          borderWidth: 2,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 8,
              usePointStyle: true,
              font: { size: 9, weight: 'bold' },
              color: 'rgba(214, 227, 252, 0.5)',
              padding: 20
            }
          }
        }
      }
    });
  }
}
