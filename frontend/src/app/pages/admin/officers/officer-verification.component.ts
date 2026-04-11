import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-officer-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="verify-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">🛡️ Institutional Verification</h1>
          <p class="page-sub">Authorize or reject government employee access requests.</p>
        </div>
        <div class="tab-group">
          <button class="tab-btn" [class.tab-active]="activeTab() === 'PENDING'" (click)="load('PENDING')">
            Pending Approval
            @if (officers().length > 0 && activeTab() === 'PENDING') {
              <span class="tab-count">{{ officers().length }}</span>
            }
          </button>
          <button class="tab-btn" [class.tab-active]="activeTab() === 'APPROVED'" (click)="load('APPROVED')">Active Officers</button>
          <button class="tab-btn" [class.tab-active]="activeTab() === ''" (click)="load('')">All</button>
        </div>
      </div>

      <div class="verify-grid">
        <!-- Officer List -->
        <div class="officer-list">
          @for (o of officers(); track o.id) {
            <div class="officer-card" [class.officer-selected]="selected()?.id === o.id" (click)="selected.set(o)">
              <div class="officer-card-inner">
                <div class="officer-avatar">{{ o.name[0] }}</div>
                <div class="officer-info">
                  <div class="officer-name">{{ o.name }}</div>
                  <div class="officer-dept">{{ o.department || 'Dept. Not Set' }}</div>
                </div>
                <span class="status-chip" [ngClass]="'status-' + o.status.toLowerCase()">{{ o.status }}</span>
              </div>
              <div class="officer-id">{{ o.id.slice(0,8).toUpperCase() }}...</div>
            </div>
          } @empty {
            <div class="empty-state">
              <span style="font-size:3rem">📋</span>
              <p>No officer requests</p>
            </div>
          }
        </div>

        <!-- Detail Panel -->
        <div class="detail-panel">
          @if (selected(); as o) {
            <div class="officer-detail">
              <div class="detail-header">
                <div class="detail-avatar">{{ o.name[0] }}</div>
                <div>
                  <h2 class="detail-name">{{ o.name }}</h2>
                  <p class="detail-email">{{ o.email }}</p>
                  <div class="detail-chips">
                    <span class="chip chip-blue">{{ o.designation || 'Designation Pending' }}</span>
                    <span class="chip chip-dim">ID: {{ o.emp_id || 'N/A' }}</span>
                  </div>
                </div>
                <span class="status-chip-lg" [ngClass]="'status-' + o.status.toLowerCase()">{{ o.status }}</span>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Department</div>
                  <div class="info-value">{{ o.department || 'Not assigned' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Registered</div>
                  <div class="info-value">{{ o.created_at | date:'mediumDate' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Verification ID</div>
                  <div class="info-value" style="font-family:monospace; color:#4CD6FB">{{ o.verification_id || 'NOT YET ISSUED' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Current Status</div>
                  <div class="info-value" [ngClass]="o.status === 'APPROVED' ? 'text-green' : o.status === 'PENDING' ? 'text-amber' : 'text-red'">
                    {{ o.status }}
                  </div>
                </div>
              </div>

              @if (o.status === 'PENDING') {
                <div class="action-box">
                  <div class="action-box-title">⚖️ Adjudication Protocol</div>
                  <div class="field-group">
                    <label class="field-label">Decision Note (Optional)</label>
                    <textarea [(ngModel)]="actionNote" class="field-textarea" rows="3"
                      placeholder="Record the reason for your decision..."></textarea>
                  </div>
                  <div class="action-btns">
                    <button class="btn-approve" (click)="decide('APPROVE', o.id)" [disabled]="processing()">
                      @if (processing()) { ⌛ } @else { ✓ Authorize Access }
                    </button>
                    <button class="btn-reject" (click)="decide('REJECT', o.id)" [disabled]="processing()">
                      ✕ Reject Request
                    </button>
                  </div>
                </div>
              }
              @if (o.status === 'APPROVED') {
                <div class="verified-banner">
                  <span>🛡️</span>
                  <div>
                    <div style="font-weight:800; color:#10B981">Officer Verified by Government of India</div>
                    <div style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-top:0.25rem">Verification ID: {{ o.verification_id }}</div>
                  </div>
                  <button class="btn-suspend" (click)="decide('SUSPEND', o.id)">Suspend</button>
                </div>
              }

              @if (toastMsg()) {
                <div class="toast" [class.toast-success]="toastSuccess()">{{ toastMsg() }}</div>
              }
            </div>
          } @else {
            <div class="empty-detail">
              <span style="font-size:4rem">🛡️</span>
              <p>Select an officer to review their credentials</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0 0 0.25rem; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0; }

    .tab-group { display: flex; gap: 0.5rem; }
    .tab-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: rgba(255,255,255,0.4);
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .tab-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7); }
    .tab-active { background: rgba(76,214,251,0.1) !important; border-color: rgba(76,214,251,0.3) !important; color: #4CD6FB !important; }
    .tab-count {
      background: #4CD6FB; color: #040D1A;
      font-size: 0.6rem; font-weight: 900;
      border-radius: 999px; padding: 0 0.35rem;
      min-width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
    }

    .verify-grid { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; }

    .officer-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 70vh; overflow-y: auto; }
    .officer-list::-webkit-scrollbar { width: 3px; }
    .officer-list::-webkit-scrollbar-thumb { background: rgba(76,214,251,0.15); border-radius: 2px; }

    .officer-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    .officer-card:hover { background: rgba(255,255,255,0.05); border-left-color: rgba(76,214,251,0.3); }
    .officer-selected { background: rgba(76,214,251,0.06) !important; border-left-color: #4CD6FB !important; }
    .officer-card-inner { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; }
    .officer-avatar {
      width: 34px; height: 34px;
      background: rgba(76,214,251,0.1);
      border: 1px solid rgba(76,214,251,0.2);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 800; color: #4CD6FB;
      flex-shrink: 0;
    }
    .officer-info { flex: 1; overflow: hidden; }
    .officer-name { font-size: 0.8rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .officer-dept { font-size: 0.65rem; color: rgba(255,255,255,0.35); }
    .officer-id { font-size: 0.6rem; font-family: monospace; color: rgba(255,255,255,0.15); padding-left: 0.25rem; }

    .status-chip {
      font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
      padding: 0.2rem 0.5rem; border-radius: 5px; flex-shrink: 0;
    }
    .status-pending { background: rgba(245,158,11,0.15); color: #F59E0B; }
    .status-approved { background: rgba(16,185,129,0.15); color: #10B981; }
    .status-rejected { background: rgba(239,68,68,0.15); color: #ef4444; }
    .status-suspended { background: rgba(156,163,175,0.15); color: #9CA3AF; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 0.75rem; opacity: 0.3; }
    .empty-state p { font-size: 0.8rem; }

    /* Detail Panel */
    .detail-panel { min-height: 400px; }
    .officer-detail {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      overflow: hidden;
    }
    .detail-header {
      display: flex; align-items: flex-start; gap: 1.5rem;
      padding: 2rem; background: rgba(255,255,255,0.02);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .detail-avatar {
      width: 64px; height: 64px;
      background: rgba(76,214,251,0.1);
      border: 1px solid rgba(76,214,251,0.2);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800; color: #4CD6FB;
      flex-shrink: 0;
    }
    .detail-name { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 0.25rem; }
    .detail-email { font-size: 0.8rem; color: rgba(255,255,255,0.4); margin-bottom: 0.75rem; }
    .detail-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .chip { font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 5px; }
    .chip-blue { background: rgba(76,214,251,0.1); color: #4CD6FB; border: 1px solid rgba(76,214,251,0.2); }
    .chip-dim { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.08); }
    .status-chip-lg { margin-left: auto; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.3rem 0.75rem; border-radius: 7px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .info-item { padding: 1.25rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .info-item:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.04); }
    .info-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.25); margin-bottom: 0.4rem; }
    .info-value { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.85); }
    .text-green { color: #10B981 !important; }
    .text-amber { color: #F59E0B !important; }
    .text-red { color: #ef4444 !important; }

    .action-box { margin: 1.5rem 2rem; padding: 1.5rem; background: rgba(245,158,11,0.04); border: 1px solid rgba(245,158,11,0.1); border-radius: 14px; }
    .action-box-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #F59E0B; margin-bottom: 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .field-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.3); }
    .field-textarea {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      padding: 0.75rem 1rem; color: #fff; font-size: 0.8rem; font-family: inherit;
      outline: none; resize: vertical; transition: border-color 0.2s;
    }
    .field-textarea:focus { border-color: rgba(245,158,11,0.3); }
    .action-btns { display: flex; gap: 0.75rem; }
    .btn-approve {
      padding: 0.75rem 1.5rem; background: #10B981; color: #fff; border: none; border-radius: 10px;
      font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
      cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-approve:hover:not(:disabled) { background: #059669; box-shadow: 0 4px 16px rgba(16,185,129,0.3); }
    .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-reject {
      padding: 0.75rem 1.5rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 10px; color: #ef4444; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-reject:hover:not(:disabled) { background: rgba(239,68,68,0.15); }
    .btn-reject:disabled { opacity: 0.5; }

    .verified-banner {
      margin: 1.5rem 2rem; padding: 1rem 1.25rem;
      background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px;
      display: flex; align-items: center; gap: 1rem; font-size: 1.25rem;
    }
    .btn-suspend {
      margin-left: auto; padding: 0.5rem 1rem; background: rgba(156,163,175,0.1);
      border: 1px solid rgba(156,163,175,0.2); border-radius: 8px;
      color: #9CA3AF; font-size: 0.7rem; font-weight: 700; cursor: pointer; font-family: inherit;
    }

    .toast {
      margin: 0 2rem 1.5rem; padding: 0.75rem 1rem; border-radius: 10px;
      font-size: 0.75rem; font-weight: 700;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171;
    }
    .toast-success { background: rgba(16,185,129,0.1) !important; border-color: rgba(16,185,129,0.2) !important; color: #10B981 !important; }

    .empty-detail { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 1rem; opacity: 0.2; font-size: 0.85rem; }
  `]
})
export class OfficerVerificationComponent implements OnInit {
  activeTab = signal('PENDING');
  officers = signal<any[]>([]);
  selected = signal<any>(null);
  processing = signal(false);
  actionNote = '';
  toastMsg = signal('');
  toastSuccess = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit() { this.load('PENDING'); }

  load(status: string) {
    this.activeTab.set(status);
    this.selected.set(null);
    const token = localStorage.getItem('civyx_token');
    const url = status ? `/api/admin/officers?status=${status}` : '/api/admin/officers';
    this.http.get<any[]>(url, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (r) => this.officers.set(r),
      error: () => this.showToast('Failed to load officers.', false)
    });
  }

  decide(action: string, id: string) {
    this.processing.set(true);
    const token = localStorage.getItem('civyx_token');
    this.http.post<any>(`/api/admin/officers/${id}/verify`, { action, reason: this.actionNote }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        this.processing.set(false);
        this.actionNote = '';
        this.showToast(action === 'APPROVE' ? `Officer authorized. Verification ID: ${res.verification_id}` : `Officer ${action.toLowerCase()}ed.`, true);
        this.load(this.activeTab());
      },
      error: () => { this.processing.set(false); this.showToast('Action failed. Try again.', false); }
    });
  }

  showToast(msg: string, success: boolean) {
    this.toastMsg.set(msg);
    this.toastSuccess.set(success);
    setTimeout(() => this.toastMsg.set(''), 4000);
  }
}
