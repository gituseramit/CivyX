import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-mark">G</div>
          <div>
            <div class="brand-name">Civy<span class="brand-x">X</span></div>
            <div class="brand-sub">Command Portal</div>
          </div>
        </div>

        <nav class="nav-links">
          <a routerLink="/admin/dashboard" routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">⬛</span><span>Master Dashboard</span>
          </a>

          <div class="nav-group-label">Governance</div>
          <a routerLink="/admin/officers" routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">✓</span><span>Officer Verification</span>
            @if (pendingCount() > 0) {
              <span class="nav-badge">{{ pendingCount() }}</span>
            }
          </a>

          <div class="nav-group-label">System Control</div>
          <a routerLink="/admin/settings" routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">⚙</span><span>Dynamic Config</span>
          </a>
          <a routerLink="/admin/audit-logs" routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">📜</span><span>Audit Trail</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="admin-profile">
            <div class="profile-avatar">{{ adminInitials() }}</div>
            <div class="profile-info">
              <div class="profile-name">{{ adminName() }}</div>
              <div class="profile-role">{{ adminRoleLabel() }}</div>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()">⏻ Terminate Session</button>
        </div>
      </aside>

      <!-- Main -->
      <main class="main-area">
        <header class="top-bar">
          <div class="breadcrumb">
            Command Portal <span class="breadcrumb-sep">›</span>
            <span class="breadcrumb-current">{{ currentPage() }}</span>
          </div>
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>System: Nominal</span>
          </div>
        </header>

        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }

    .admin-shell {
      display: flex;
      height: 100vh;
      background: #040D1A;
      color: #fff;
      font-family: 'Inter', 'Space Grotesk', sans-serif;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 260px;
      min-width: 260px;
      background: #071525;
      border-right: 1px solid rgba(255,255,255,0.05);
      display: flex;
      flex-direction: column;
      z-index: 20;
    }

    .sidebar-brand {
      padding: 1.75rem 1.5rem 2rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .brand-mark {
      width: 36px; height: 36px;
      background: #4CD6FB;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 1rem;
      color: #040D1A;
    }
    .brand-name {
      font-size: 1.2rem;
      font-weight: 900;
      letter-spacing: -0.04em;
      color: #fff;
    }
    .brand-x { color: #4CD6FB; font-style: italic; }
    .brand-sub {
      font-size: 0.55rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: rgba(255,255,255,0.25);
      margin-top: 1px;
    }

    .nav-links {
      flex: 1;
      padding: 1.25rem 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nav-group-label {
      font-size: 0.55rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      color: rgba(255,255,255,0.2);
      padding: 1.25rem 0.75rem 0.4rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      text-decoration: none;
      color: rgba(255,255,255,0.45);
      font-size: 0.78rem;
      font-weight: 600;
      transition: all 0.2s;
      border-left: 3px solid transparent;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.04);
      color: rgba(255,255,255,0.8);
    }
    .nav-active {
      background: rgba(76,214,251,0.08) !important;
      color: #4CD6FB !important;
      border-left-color: #4CD6FB !important;
    }
    .nav-icon { font-size: 0.85rem; width: 18px; text-align: center; }
    .nav-badge {
      margin-left: auto;
      width: 20px; height: 20px;
      background: #4CD6FB;
      color: #040D1A;
      font-size: 0.65rem;
      font-weight: 900;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }

    .sidebar-footer {
      padding: 1rem 1.25rem 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .admin-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      margin-bottom: 0.75rem;
    }
    .profile-avatar {
      width: 36px; height: 36px;
      background: rgba(76,214,251,0.15);
      border: 1px solid rgba(76,214,251,0.3);
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 900;
      color: #4CD6FB;
      display: flex; align-items: center; justify-content: center;
    }
    .profile-name { font-size: 0.75rem; font-weight: 700; color: #fff; }
    .profile-role {
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #4CD6FB;
      margin-top: 1px;
    }
    .btn-logout {
      width: 100%;
      padding: 0.6rem;
      background: rgba(239,68,68,0.06);
      border: 1px solid rgba(239,68,68,0.15);
      border-radius: 8px;
      color: #f87171;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .btn-logout:hover {
      background: rgba(239,68,68,0.12);
      border-color: rgba(239,68,68,0.3);
    }

    /* ── Main Area ── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .top-bar {
      height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      background: rgba(4,13,26,0.6);
      backdrop-filter: blur(12px);
      flex-shrink: 0;
      z-index: 10;
    }
    .breadcrumb {
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255,255,255,0.4);
    }
    .breadcrumb-sep { margin: 0 0.5rem; opacity: 0.4; }
    .breadcrumb-current { color: #4CD6FB; font-weight: 700; }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      border-radius: 999px;
      background: rgba(16,185,129,0.08);
      border: 1px solid rgba(16,185,129,0.2);
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #10B981;
    }
    .status-dot {
      width: 6px; height: 6px;
      background: #10B981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 2.5rem;
    }
    .content-area::-webkit-scrollbar { width: 4px; }
    .content-area::-webkit-scrollbar-track { background: transparent; }
    .content-area::-webkit-scrollbar-thumb { background: rgba(76,214,251,0.15); border-radius: 4px; }
  `]
})
export class AdminLayoutComponent implements OnInit {
  pendingCount = signal(0);
  adminName = signal('Super Admin');
  adminRoleLabel = signal('Super Admin');
  currentPage = signal('Dashboard');
  adminInitials = signal('SA');

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    // Load user from localStorage
    try {
      const user = JSON.parse(localStorage.getItem('civyx_user') || '{}');
      if (user.name) {
        this.adminName.set(user.name);
        this.adminInitials.set(user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2));
      }
      if (user.admin_role) {
        this.adminRoleLabel.set(user.admin_role.replace(/_/g, ' ').toUpperCase());
      }
    } catch {}

    // Fetch pending officers count
    const token = localStorage.getItem('civyx_token');
    if (token) {
      this.http.get<any[]>('/api/admin/officers?status=PENDING', {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({ next: (r) => this.pendingCount.set(r.length) });
    }

    // Track active page name
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url;
      if (url.includes('dashboard')) this.currentPage.set('Master Dashboard');
      else if (url.includes('officers')) this.currentPage.set('Officer Verification');
      else if (url.includes('settings')) this.currentPage.set('Dynamic Config');
      else if (url.includes('audit')) this.currentPage.set('Audit Trail');
    });
  }

  logout() {
    localStorage.removeItem('civyx_token');
    localStorage.removeItem('civyx_user');
    this.router.navigate(['/admin/login']);
  }
}
