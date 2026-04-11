import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">⚙️ Dynamic Configuration</h1>
          <p class="page-sub">Modify the platform's operational parameters in real-time — no redeployment required.</p>
        </div>
        <button class="btn-save" (click)="saveSettings()" [disabled]="saving()">
          @if (saving()) { ⌛ Committing... } @else { 💾 Commit Changes }
        </button>
      </div>

      @if (toast()) {
        <div class="toast" [class.toast-success]="toastSuccess()">{{ toast() }}</div>
      }

      <div class="settings-grid">

        <!-- Grievance Categories -->
        <div class="card">
          <h3 class="card-title">📂 Grievance Classification Engine</h3>
          <p class="card-sub">Manage category types visible when citizens file complaints.</p>
          <div class="category-list">
            @for (cat of settings.categories; track cat; let i = $index) {
              <div class="category-row">
                <input [(ngModel)]="settings.categories[i]" [name]="'cat' + i" class="cat-input" />
                <button class="btn-remove" (click)="removeCategory(i)">✕</button>
              </div>
            }
            <button class="btn-add" (click)="addCategory()">+ Add New Category</button>
          </div>
        </div>

        <!-- Feature Flags -->
        <div class="card">
          <h3 class="card-title">🔧 Platform Feature Flags</h3>
          <p class="card-sub">Toggle features across all portal users instantly.</p>
          <div class="flag-list">
            <div class="flag-row">
              <div class="flag-info">
                <div class="flag-name">Voice Input (Sarvam AI)</div>
                <div class="flag-desc">Allow citizens to record voice complaints using speech-to-text.</div>
              </div>
              <button class="toggle" [class.toggle-on]="settings.allow_voice" (click)="settings.allow_voice = !settings.allow_voice">
                <span class="toggle-ball"></span>
              </button>
            </div>
            <div class="flag-row">
              <div class="flag-info">
                <div class="flag-name">AI Auto-Classification (Groq)</div>
                <div class="flag-desc">Automatically classify and prioritize incoming complaints with AI.</div>
              </div>
              <button class="toggle" [class.toggle-on]="settings.ai_triage" (click)="settings.ai_triage = !settings.ai_triage">
                <span class="toggle-ball"></span>
              </button>
            </div>
            <div class="flag-row">
              <div class="flag-info">
                <div class="flag-name">Public Transparency Feed</div>
                <div class="flag-desc">Expose anonymized complaint data on the public feed page.</div>
              </div>
              <button class="toggle" [class.toggle-on]="settings.public_feed" (click)="settings.public_feed = !settings.public_feed">
                <span class="toggle-ball"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Branding -->
        <div class="card">
          <h3 class="card-title">🏛️ Institutional Identity</h3>
          <p class="card-sub">Configure platform branding and display information.</p>
          <div class="brand-form">
            <div class="brand-field">
              <label>System Title</label>
              <input [(ngModel)]="settings.site_title" name="siteTitle" class="brand-input" placeholder="CivyX" />
            </div>
            <div class="brand-field">
              <label>Institutional Motto</label>
              <input [(ngModel)]="settings.site_motto" name="siteMotto" class="brand-input" placeholder="Your Voice, Resolved by Intelligence." />
            </div>
          </div>
        </div>

        <!-- Architect's Note -->
        <div class="note-card">
          <div class="note-title">⚡ Architect's Note</div>
          <p class="note-body">Settings committed here are propagated across the platform within 500ms. Citizen and officer interfaces will reflect changes immediately on next page load — no redeployment required.</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.25rem; font-weight: 900; color: #fff; margin: 0 0 0.25rem; }
    .page-sub { font-size: 0.78rem; color: rgba(255,255,255,0.4); margin: 0; }
    .btn-save {
      padding: 0.75rem 1.5rem; background: #4CD6FB; color: #040D1A;
      font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
      border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-save:hover:not(:disabled) { background: #6DE0FB; box-shadow: 0 4px 16px rgba(76,214,251,0.3); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

    .toast {
      padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.78rem; font-weight: 700;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #f87171;
    }
    .toast-success { background: rgba(16,185,129,0.1) !important; border-color: rgba(16,185,129,0.2) !important; color: #10B981 !important; }

    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

    .card {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 20px; padding: 1.75rem;
    }
    .card-title { font-size: 0.9rem; font-weight: 800; color: #fff; margin: 0 0 0.4rem; }
    .card-sub { font-size: 0.72rem; color: rgba(255,255,255,0.35); margin: 0 0 1.5rem; line-height: 1.5; }

    .category-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .category-row { display: flex; gap: 0.5rem; }
    .cat-input {
      flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 0.6rem 0.875rem; color: #fff; font-size: 0.8rem; font-family: inherit; outline: none;
    }
    .cat-input:focus { border-color: rgba(76,214,251,0.3); }
    .btn-remove {
      padding: 0 0.75rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
      border-radius: 8px; color: #ef4444; cursor: pointer; font-size: 0.75rem; font-family: inherit;
    }
    .btn-add {
      padding: 0.6rem; background: none; border: 1px dashed rgba(76,214,251,0.2); border-radius: 8px;
      color: rgba(76,214,251,0.6); font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: inherit;
      transition: all 0.2s;
    }
    .btn-add:hover { background: rgba(76,214,251,0.04); color: #4CD6FB; }

    .flag-list { display: flex; flex-direction: column; gap: 0; }
    .flag-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .flag-row:last-child { border-bottom: none; }
    .flag-info { flex: 1; }
    .flag-name { font-size: 0.8rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
    .flag-desc { font-size: 0.68rem; color: rgba(255,255,255,0.35); line-height: 1.5; }
    .toggle {
      width: 44px; height: 24px; border-radius: 12px; background: rgba(255,255,255,0.1);
      border: none; cursor: pointer; padding: 3px; display: flex; align-items: center;
      transition: all 0.25s; flex-shrink: 0;
    }
    .toggle-on { background: #4CD6FB; justify-content: flex-end; }
    .toggle-ball {
      width: 18px; height: 18px; background: #fff; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    .brand-form { display: flex; flex-direction: column; gap: 1rem; }
    .brand-field { display: flex; flex-direction: column; gap: 0.4rem; }
    .brand-field label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.3); }
    .brand-input {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 0.75rem 1rem; color: #fff; font-size: 0.85rem; font-family: inherit; outline: none;
    }
    .brand-input:focus { border-color: rgba(76,214,251,0.3); }

    .note-card {
      background: rgba(76,214,251,0.03); border: 1px solid rgba(76,214,251,0.08);
      border-radius: 20px; padding: 1.75rem; grid-column: span 2;
    }
    .note-title { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #4CD6FB; margin-bottom: 0.75rem; }
    .note-body { font-size: 0.78rem; color: rgba(255,255,255,0.4); line-height: 1.7; margin: 0; font-style: italic; }
  `]
})
export class AdminSettingsComponent implements OnInit {
  settings: any = {
    categories: ['Sanitation', 'Roads', 'Electricity', 'Water', 'Public Safety'],
    allow_voice: true,
    ai_triage: true,
    public_feed: true,
    site_title: 'CivyX',
    site_motto: 'Your Voice, Resolved by Intelligence.'
  };
  saving = signal(false);
  toast = signal('');
  toastSuccess = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('civyx_token');
    this.http.get<any>('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (res) => {
        if (res.categories) this.settings.categories = res.categories;
        if (res.allow_voice !== undefined) this.settings.allow_voice = res.allow_voice;
      }
    });
  }

  addCategory() { this.settings.categories.push('New Category'); }
  removeCategory(i: number) { this.settings.categories.splice(i, 1); }

  saveSettings() {
    this.saving.set(true);
    const token = localStorage.getItem('civyx_token');
    this.http.post<any>('/api/admin/settings', this.settings, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => { this.saving.set(false); this.showToast('All changes committed successfully!', true); },
      error: () => { this.saving.set(false); this.showToast('Failed to commit changes.', false); }
    });
  }

  showToast(msg: string, success: boolean) {
    this.toast.set(msg); this.toastSuccess.set(success);
    setTimeout(() => this.toast.set(''), 4000);
  }
}
