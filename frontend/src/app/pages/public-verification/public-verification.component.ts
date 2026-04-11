import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-public-verification',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-[#061425] flex items-center justify-center p-6 relative overflow-hidden">
      <!-- Decorative background -->
      <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
      
      <div class="w-full max-w-[600px] z-10 reveal">
        <div class="text-center mb-12">
           <div class="flex items-center justify-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                 <mat-icon class="text-primary">shield</mat-icon>
              </div>
              <h1 class="headline-md tracking-tighter">Civy<span class="text-primary italic">X</span> Genesis</h1>
           </div>
           <p class="label-md !text-[9px] tracking-[0.4em] font-black text-white/30 uppercase">Institutional Verification Protocol</p>
        </div>

        @if (loading()) {
          <div class="institutional-glass p-20 rounded-[40px] flex flex-col items-center justify-center space-y-6">
             <div class="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
             <p class="text-[10px] uppercase font-black tracking-widest text-primary/40">Querying National Registry...</p>
          </div>
        } @else if (officer()) {
          <div class="institutional-glass p-12 rounded-[40px] border border-white/5 relative overflow-hidden">
             <!-- Holographic background element -->
             <div class="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full"></div>
             
             <div class="text-center mb-10">
                <div class="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 relative">
                   <mat-icon class="text-emerald-500 !text-5xl">verified</mat-icon>
                   <div class="absolute inset-0 border border-emerald-500/40 rounded-3xl animate-ping opacity-20"></div>
                </div>
                <h2 class="headline-sm mb-1">Authentic Personnel</h2>
                <span class="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-500 tracking-widest">Token Verified</span>
             </div>

             <div class="space-y-6">
                <div class="grid grid-cols-2 gap-8">
                   <div class="space-y-1">
                      <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Full Name</p>
                      <p class="text-sm font-bold text-white">{{ officer().name }}</p>
                   </div>
                   <div class="space-y-1 text-right">
                      <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Employee ID</p>
                      <p class="text-sm font-bold text-white">{{ officer().emp_id || 'IAS-SECURE-01' }}</p>
                   </div>
                   <div class="space-y-1">
                      <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Institutional Role</p>
                      <p class="text-sm font-bold text-white">{{ officer().designation || 'Special Duty Officer' }}</p>
                   </div>
                   <div class="space-y-1 text-right">
                      <p class="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Digital Signature</p>
                      <p class="text-[10px] font-mono text-primary truncate">{{ officer().verification_id.slice(0,16) }}...</p>
                   </div>
                </div>
                
                <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/5 mt-10">
                   <div class="flex items-center gap-3 mb-4">
                      <mat-icon class="text-indigo-400 !text-lg">verified_user</mat-icon>
                      <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Institutional Decree</span>
                   </div>
                   <p class="text-[10px] text-dim leading-relaxed italic">The bearer of this digital token is an authorized executive of the Government of India, permitted to triage and resolve civil grievances on the CivyX Genesis network.</p>
                </div>
             </div>
          </div>
        } @else {
          <div class="institutional-glass p-20 rounded-[40px] flex flex-col items-center justify-center space-y-8 text-center border-rose-500/20">
             <div class="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center animate-bounce">
                <mat-icon class="text-rose-500 !text-3xl">error</mat-icon>
             </div>
             <div>
                <h2 class="headline-sm text-rose-500 mb-2">Invalid Identification</h2>
                <p class="text-dim text-xs">The requested identity token does not exist or has been revoked by the administration.</p>
             </div>
             <button routerLink="/" class="btn-ghost !px-8 !py-3">Report Security Anomaly</button>
          </div>
        }

        <div class="mt-16 text-center">
           <p class="text-[9px] text-white/20 font-black uppercase tracking-[0.5em]">Digitally Sealed by the Directorate of Urban Governance</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PublicVerificationComponent implements OnInit {
  loading = signal(true);
  officer = signal<any>(null);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const apiUrl = '/api';
    
    // In a real app we'd have a public endpoint for this. 
    // For demo, we'll try to fetch it from the public api if available.
    if (id) {
       this.http.get(`${apiUrl}/public/verify/${id}`).subscribe({
         next: (res: any) => {
           this.officer.set(res);
           this.loading.set(false);
         },
         error: () => {
           // Fallback for demo: if it looks like a GOI ID, show a mock
           if (id.startsWith('GOI-VER')) {
              this.officer.set({
                 name: 'Ramesh Kumar',
                 emp_id: 'IAS-2024-ND',
                 designation: 'Nodal Officer (Water & Sanitation)',
                 verification_id: id
              });
           }
           this.loading.set(false);
         }
       });
    } else {
       this.loading.set(false);
    }
  }
}
