import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-govt-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group relative cursor-help">
       <div class="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <mat-icon class="text-[#061425] !text-[12px] font-bold">verified</mat-icon>
       </div>
       <span class="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified by Govt. of India</span>
       
       <!-- Tooltip with Certificate Info -->
       <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-4 institutional-glass rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
          <div class="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Institutional Certificate</div>
          <div class="text-[10px] text-white font-bold mb-1">{{ officerName }}</div>
          <div class="text-[8px] text-white/40 font-mono mb-3">ID: {{ verificationId || 'VER-SEQUENCE-PENDING' }}</div>
          <div class="flex items-center gap-2 pt-2 border-t border-white/5">
             <mat-icon class="text-emerald-500 !text-xs">security</mat-icon>
             <span class="text-[7px] text-dim italic">Cryptographically signed by MoEIT</span>
          </div>
       </div>
    </div>
  `,
  styles: []
})
export class GovtBadgeComponent {
  @Input() officerName = 'Official Authority';
  @Input() verificationId = '';
}
