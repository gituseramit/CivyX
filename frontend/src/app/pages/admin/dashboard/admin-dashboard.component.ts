import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card" style="border-left-color: #4CD6FB">
          <div class="stat-label">Total Citizens</div>
          <div class="stat-value">{{ stats().citizens }}</div>
          <div class="stat-footer">Registered users</div>
        </div>
        <div class="stat-card" style="border-left-color: #ADC8F5">
          <div class="stat-label">Officers</div>
          <div class="stat-value">{{ stats().officers }}</div>
          <div class="stat-footer" [style.color]="stats().pending_officers > 0 ? '#F59E0B' : '#6b7280'">
            {{ stats().pending_officers }} pending approval
          </div>
        </div>
        <div class="stat-card" style="border-left-color: #F59E0B">
          <div class="stat-label">Open Complaints</div>
          <div class="stat-value">{{ stats().complaints }}</div>
          <div class="stat-footer" [style.color]="stats().escalated > 0 ? '#ef4444' : '#6b7280'">
            {{ stats().escalated }} escalated
          </div>
        </div>
        <div class="stat-card" style="border-left-color: #10B981">
          <div class="stat-label">Resolved Today</div>
          <div class="stat-value">{{ stats().solved_today }}</div>
          <div class="stat-footer">Last 24 hours</div>
        </div>
      </div>

      <!-- Body Grid -->
      <div class="body-grid">

        <!-- Activity Feed -->
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">⚡ Live Intelligence Stream</h3>
            <span class="live-badge">● Live</span>
          </div>
          <div class="feed-list">
            @for (item of feed(); track item.id) {
              <div class="feed-item" [ngClass]="'feed-' + item.type">
                <div class="feed-icon">{{ item.icon }}</div>
                <div class="feed-body">
                  <div class="feed-title">{{ item.title }}</div>
                  <div class="feed-desc">{{ item.desc }}</div>
                </div>
                <div class="feed-meta">
                  <span class="feed-time">{{ item.time }}</span>
                  <span class="feed-loc">{{ item.location }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="actions-col">
          <div class="panel">
            <h3 class="panel-title mb-4">🎯 Strategic Actions</h3>
            <div class="action-list">
              <a routerLink="/admin/officers" class="action-card action-blue">
                <span class="action-icon">🛡️</span>
                <div>
                  <div class="action-title">Approve Officers</div>
                  <div class="action-sub">{{ stats().pending_officers }} awaiting govt. verification</div>
                </div>
                <span class="action-arrow">›</span>
              </a>
              <a routerLink="/admin/settings" class="action-card action-indigo">
                <span class="action-icon">⚙️</span>
                <div>
                  <div class="action-title">System Config</div>
                  <div class="action-sub">Dynamic portal configuration</div>
                </div>
                <span class="action-arrow">›</span>
              </a>
              <a routerLink="/admin/audit-logs" class="action-card action-green">
                <span class="action-icon">📜</span>
                <div>
                  <div class="action-title">Audit Trail</div>
                  <div class="action-sub">View all administrative actions</div>
                </div>
                <span class="action-arrow">›</span>
              </a>
            </div>
          </div>

          <!-- System Health -->
          <div class="panel health-panel">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem">
              <span class="status-dot-green"></span>
              <span style="font-size:0.65rem; font-weight:900; text-transform:uppercase; letter-spacing:0.2em; color:#10B981">System Status: Nominal</span>
            </div>
            <p style="font-size:0.75rem; color:rgba(255,255,255,0.4); line-height:1.7; font-style:italic">
              All planetary data ingestion services operating within normal delta ranges. AI triage systems active.
            </p>
            <div class="health-bar">
              <div class="health-fill" style="width:88%"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:0.4rem">
              <span style="font-size:0.6rem; color:rgba(255,255,255,0.2)">Health Index</span>
              <span style="font-size:0.6rem; color:#10B981; font-weight:700">88%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 2rem; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-left: 4px solid;
      border-radius: 16px;
      padding: 1.5rem;
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.35);
      margin-bottom: 0.75rem;
    }
    .stat-value {
      font-size: 2.25rem;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.04em;
      margin-bottom: 0.25rem;
    }
    .stat-footer {
      font-size: 0.7rem;
      font-weight: 600;
      color: #6b7280;
    }

    .body-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 1.5rem;
    }

    .panel {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px;
      padding: 1.5rem;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .panel-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }
    .mb-4 { margin-bottom: 1.25rem; }
    .live-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #4CD6FB;
      background: rgba(76,214,251,0.08);
      border: 1px solid rgba(76,214,251,0.15);
      border-radius: 999px;
      padding: 0.25rem 0.75rem;
    }

    .feed-list { display: flex; flex-direction: column; gap: 0; }
    .feed-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .feed-item:last-child { border-bottom: none; }
    .feed-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
      background: rgba(255,255,255,0.06);
    }
    .feed-NEW_COMPLAINT .feed-icon { background: rgba(76,214,251,0.1); }
    .feed-RESOLUTION .feed-icon { background: rgba(16,185,129,0.1); }
    .feed-PENDING .feed-icon { background: rgba(245,158,11,0.1); }
    .feed-ESCALATION .feed-icon { background: rgba(239,68,68,0.1); }
    .feed-body { flex: 1; }
    .feed-title { font-size: 0.8rem; font-weight: 700; color: #fff; margin-bottom: 0.2rem; }
    .feed-desc { font-size: 0.7rem; color: rgba(255,255,255,0.4); line-height: 1.5; }
    .feed-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; flex-shrink: 0; }
    .feed-time { font-size: 0.65rem; color: rgba(255,255,255,0.2); font-family: monospace; }
    .feed-loc {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 4px;
      padding: 0.15rem 0.4rem;
      color: rgba(255,255,255,0.3);
    }

    .actions-col { display: flex; flex-direction: column; gap: 1.25rem; }
    .action-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-left: 3px solid;
      text-decoration: none;
      transition: all 0.2s;
      color: #fff;
    }
    .action-card:hover { background: rgba(255,255,255,0.06); transform: translateX(2px); }
    .action-blue { border-left-color: #4CD6FB; }
    .action-indigo { border-left-color: #818CF8; }
    .action-green { border-left-color: #10B981; }
    .action-icon { font-size: 1.25rem; }
    .action-title { font-size: 0.78rem; font-weight: 700; color: #fff; }
    .action-sub { font-size: 0.65rem; color: rgba(255,255,255,0.35); margin-top: 0.15rem; }
    .action-arrow { margin-left: auto; font-size: 1.25rem; color: rgba(255,255,255,0.2); }

    .health-panel { background: rgba(16,185,129,0.03); border-color: rgba(16,185,129,0.1); }
    .status-dot-green {
      width: 8px; height: 8px;
      background: #10B981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .health-bar {
      height: 4px;
      background: rgba(255,255,255,0.06);
      border-radius: 2px;
      overflow: hidden;
      margin-top: 1rem;
    }
    .health-fill {
      height: 100%;
      background: linear-gradient(90deg, #10B981, #4CD6FB);
      border-radius: 2px;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal({ citizens: 0, officers: 0, pending_officers: 0, complaints: 0, solved_today: 0, escalated: 0 });

  feed = signal([
    { id: 1, type: 'NEW_COMPLAINT', icon: '⚠️', title: 'Critical Infrastructure Breach', time: '12m ago', desc: 'Sewerage rupture reported — Western Sector requires immediate dispatch.', location: 'Ward 4' },
    { id: 2, type: 'RESOLUTION', icon: '✅', title: 'Water Crisis Resolved', time: '45m ago', desc: 'Officer confirmed restoration of Sector 8 water supply.', location: 'Ward 1' },
    { id: 3, type: 'PENDING', icon: '👤', title: 'Officer Enlistment Request', time: '1h ago', desc: 'Employee ID: IAS-4523 awaiting institutional verification.', location: 'HQ' },
    { id: 4, type: 'ESCALATION', icon: '🔴', title: 'Grievance SLA Violation', time: '3h ago', desc: 'Case #4582 auto-escalated after 48h inactivity.', location: 'District 2' },
  ]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('civyx_token');
    if (!token) return;
    this.http.get<any>('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({ next: (res) => this.stats.set(res) });
  }
}
