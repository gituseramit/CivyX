import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">📜 Immutable Audit Trail</h1>
          <p class="page-sub">Chronological ledger of all administrative actions and governance decisions.</p>
        </div>
        <div class="encryption-badge">
          <span class="enc-dot"></span>
          <span>Storage: Encrypted · Append Only</span>
        </div>
      </div>

      <div class="audit-table-wrap">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Administrator</th>
              <th>Action Type</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            @for (log of logs(); track log.id) {
              <tr>
                <td>
                  <span class="mono-text">{{ log.created_at | date:'yyyy-MM-dd HH:mm' }}</span>
                </td>
                <td>
                  <div class="admin-cell">
                    <div class="admin-avatar">{{ (log.admin_name || 'SA')[0] }}</div>
                    <span>{{ log.admin_name || 'Super Admin' }}</span>
                  </div>
                </td>
                <td>
                  <span class="action-badge" [ngClass]="getBadgeClass(log.action)">
                    {{ log.action?.replace('_', ' ') }}
                  </span>
                </td>
                <td>
                  <span class="target-chip">{{ log.target_type?.toUpperCase() }}</span>
                  <span class="target-id">{{ (log.target_id || 'GLOBAL')?.slice(0, 12) }}</span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-row">
                  <div class="empty-state">
                    <span style="font-size:2.5rem">📋</span>
                    <p>Historical Ledger Empty — Administrative actions will appear here.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (logs().length === 0 && !loaded()) {
        <div class="loading-row">
          <div class="spinner"></div>
          <p>Querying encrypted audit store...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .audit-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0 0 0.25rem; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0; }

    .encryption-badge {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 999px;
      background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2);
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #10B981;
    }
    .enc-dot {
      width: 6px; height: 6px; background: #10B981; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .audit-table-wrap {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px; overflow: hidden;
    }
    .audit-table { width: 100%; border-collapse: collapse; }
    .audit-table th {
      padding: 1rem 1.5rem; text-align: left;
      font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em;
      color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.02);
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .audit-table td {
      padding: 1rem 1.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.7);
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .audit-table tr:last-child td { border-bottom: none; }
    .audit-table tbody tr:hover { background: rgba(255,255,255,0.01); }

    .mono-text { font-family: monospace; font-size: 0.72rem; color: rgba(255,255,255,0.35); }

    .admin-cell { display: flex; align-items: center; gap: 0.75rem; }
    .admin-avatar {
      width: 28px; height: 28px; background: rgba(76,214,251,0.1);
      border: 1px solid rgba(76,214,251,0.2); border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800; color: #4CD6FB;
    }

    .action-badge {
      display: inline-block; padding: 0.2rem 0.65rem; border-radius: 6px;
      font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
      background: rgba(76,214,251,0.1); color: #4CD6FB; border: 1px solid rgba(76,214,251,0.15);
    }
    .badge-verify { background: rgba(16,185,129,0.1); color: #10B981; border-color: rgba(16,185,129,0.15); }
    .badge-login { background: rgba(99,102,241,0.1); color: #818CF8; border-color: rgba(99,102,241,0.15); }
    .badge-update { background: rgba(245,158,11,0.1); color: #F59E0B; border-color: rgba(245,158,11,0.15); }
    .badge-reject { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.15); }

    .target-chip {
      font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 4px; padding: 0.15rem 0.4rem; color: rgba(255,255,255,0.35); margin-right: 0.5rem;
    }
    .target-id { font-family: monospace; font-size: 0.72rem; color: rgba(255,255,255,0.35); }

    .empty-row { text-align: center; padding: 4rem !important; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; opacity: 0.3; }
    .empty-state p { font-size: 0.8rem; }

    .loading-row { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 3rem; opacity: 0.4; }
    .spinner { width: 20px; height: 20px; border: 2px solid rgba(76,214,251,0.2); border-top-color: #4CD6FB; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-row p { font-size: 0.8rem; }
  `]
})
export class AdminAuditLogsComponent implements OnInit {
  logs = signal<any[]>([]);
  loaded = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('civyx_token');
    this.http.get<any[]>('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (r) => { this.logs.set(r); this.loaded.set(true); },
      error: () => this.loaded.set(true)
    });
  }

  getBadgeClass(action: string): string {
    if (!action) return '';
    if (action.includes('VERIFY') || action.includes('APPROVE')) return 'badge-verify';
    if (action.includes('LOGIN')) return 'badge-login';
    if (action.includes('UPDATE')) return 'badge-update';
    if (action.includes('REJECT')) return 'badge-reject';
    return '';
  }
}
