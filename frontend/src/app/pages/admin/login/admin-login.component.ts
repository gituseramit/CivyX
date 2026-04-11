import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-login-root">
      <!-- Atmospheric deep BG -->
      <div class="bg-aura bg-aura-top"></div>
      <div class="bg-aura bg-aura-bottom"></div>

      <div class="login-card">

        <!-- Header -->
        <div class="login-header">
          <div class="gov-seal">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L20 12H30L22 18.5L25 29L16 23L7 29L10 18.5L2 12H12L16 2Z" fill="#4CD6FB" opacity="0.9"/>
            </svg>
          </div>
          <h1 class="login-title">Government of India</h1>
          <span class="login-subtitle">CivyX Civic Intelligence — Command Portal</span>
        </div>

        @if (!otpSent()) {
          <!-- Phase 1: Credentials -->
          <form (ngSubmit)="submitCredentials()" class="login-form">
            <div class="field-group">
              <label class="field-label">Institutional ID</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="admin@civyx.gov.in"
                class="field-input"
                [disabled]="loading()"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Authorization Secret</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••••••"
                class="field-input"
                [disabled]="loading()"
              />
            </div>

            @if (errorMsg()) {
              <div class="error-banner">⚠ {{ errorMsg() }}</div>
            }

            <button type="submit" class="btn-auth" [disabled]="loading() || !email || !password">
              @if (loading()) {
                <span class="spinner"></span>
              } @else {
                <span>Authenticate Securely</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
              }
            </button>
          </form>

        } @else {
          <!-- Phase 2: 2FA OTP -->
          <div class="otp-phase">
            <div class="otp-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#F59E0B"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/></svg>
            </div>
            <h3 class="otp-title">2FA Security Challenge</h3>
            <p class="otp-desc">
              A One-Time Password has been dispatched to:<br/>
              <strong>{{ email }}</strong>
            </p>
            <p class="otp-demo-note">⟶ Demo OTP: <strong>123456</strong></p>

            <div class="field-group" style="margin-top: 1.5rem">
              <label class="field-label">Enter 6-Digit OTP</label>
              <input
                type="text"
                [(ngModel)]="otp"
                name="otp"
                maxlength="6"
                placeholder="0 0 0 0 0 0"
                class="field-input otp-input"
                [disabled]="loading()"
                (keyup.enter)="verifyOTP()"
              />
            </div>

            @if (errorMsg()) {
              <div class="error-banner">⚠ {{ errorMsg() }}</div>
            }

            <button class="btn-auth btn-amber" (click)="verifyOTP()" [disabled]="loading() || otp.length < 6">
              @if (loading()) {
                <span class="spinner spinner-dark"></span>
              } @else {
                <span>Verify & Enter Command Portal</span>
              }
            </button>

            <button class="btn-reset" (click)="reset()">↩ Reset Authentication Protocol</button>
          </div>
        }

        <p class="legal-note">
          PROPRIETARY GOVT. NATIONAL INFORMATION SYSTEM<br/>
          Unauthorized access is monitored and prosecuted under IT Act 2000.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .admin-login-root {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #040D1A;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      font-family: 'Inter', 'Space Grotesk', sans-serif;
    }

    .bg-aura {
      position: absolute;
      border-radius: 50%;
      filter: blur(120px);
      pointer-events: none;
    }
    .bg-aura-top {
      width: 600px; height: 600px;
      background: rgba(76, 214, 251, 0.08);
      top: -200px; right: -100px;
    }
    .bg-aura-bottom {
      width: 500px; height: 500px;
      background: rgba(99, 102, 241, 0.06);
      bottom: -200px; left: -100px;
    }

    .login-card {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 440px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 28px;
      padding: 3rem;
      backdrop-filter: blur(20px);
      box-shadow: 0 40px 80px rgba(0,0,0,0.4);
    }

    .login-header { text-align: center; margin-bottom: 2.5rem; }
    .gov-seal {
      width: 64px; height: 64px;
      background: rgba(76, 214, 251, 0.08);
      border: 1px solid rgba(76, 214, 251, 0.2);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem;
    }
    .login-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 0.5rem;
      letter-spacing: -0.03em;
    }
    .login-subtitle {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      color: rgba(76, 214, 251, 0.6);
    }

    .login-form { display: flex; flex-direction: column; gap: 1.25rem; }

    .field-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-label {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: rgba(255,255,255,0.35);
    }
    .field-input {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 0.875rem 1rem;
      color: #fff;
      font-size: 0.875rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
    }
    .field-input:focus {
      border-color: rgba(76, 214, 251, 0.4);
      background: rgba(76, 214, 251, 0.04);
      box-shadow: 0 0 0 3px rgba(76, 214, 251, 0.08);
    }
    .field-input::placeholder { color: rgba(255,255,255,0.2); }
    .field-input:disabled { opacity: 0.5; cursor: not-allowed; }

    .otp-input {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.5em;
      font-family: monospace;
    }

    .btn-auth {
      margin-top: 0.75rem;
      padding: 1rem 1.5rem;
      background: #4CD6FB;
      color: #040D1A;
      font-weight: 800;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      transition: all 0.25s;
      font-family: inherit;
      width: 100%;
    }
    .btn-auth:hover:not(:disabled) {
      background: #6DE0FB;
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(76, 214, 251, 0.3);
    }
    .btn-auth:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-amber { background: #F59E0B; color: #0f0f0f; }
    .btn-amber:hover:not(:disabled) {
      background: #FBBF24;
      box-shadow: 0 8px 24px rgba(245,158,11,0.3);
    }

    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #003044;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-dark {
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: #fff;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      color: #f87171;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .otp-phase { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .otp-icon {
      width: 80px; height: 80px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1.25rem;
      animation: pulse-amber 2s infinite;
    }
    @keyframes pulse-amber {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.2); }
      50% { box-shadow: 0 0 0 12px rgba(245,158,11,0); }
    }
    .otp-title { font-size: 1.1rem; font-weight: 800; color: #F59E0B; margin: 0 0 0.75rem; }
    .otp-desc { font-size: 0.8rem; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 0.5rem; }
    .otp-desc strong { color: rgba(255,255,255,0.85); }
    .otp-demo-note {
      font-size: 0.7rem;
      color: rgba(76,214,251,0.6);
      background: rgba(76,214,251,0.06);
      border: 1px dashed rgba(76,214,251,0.2);
      border-radius: 8px;
      padding: 0.4rem 1rem;
      margin-bottom: 0.5rem;
    }
    .otp-demo-note strong { color: #4CD6FB; }
    .otp-phase .field-group { width: 100%; }
    .otp-phase .btn-auth { width: 100%; margin-top: 1rem; }

    .btn-reset {
      background: none; border: none;
      color: rgba(255,255,255,0.25);
      font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      cursor: pointer; margin-top: 1rem;
      transition: color 0.2s; font-family: inherit;
      padding: 0.5rem;
    }
    .btn-reset:hover { color: rgba(255,255,255,0.5); }

    .legal-note {
      margin-top: 2rem;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.12);
      text-align: center;
      line-height: 1.8;
    }
  `]
})
export class AdminLoginComponent {
  email = '';
  password = '';
  otp = '';
  otpSent = signal(false);
  loading = signal(false);
  errorMsg = signal('');

  constructor(private http: HttpClient, private router: Router) {}

  submitCredentials() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.http.post<any>('/api/admin/login', { admin_id: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.message === '2FA_REQUIRED') {
          this.otpSent.set(true);
        } else if (res.token) {
          this.persistAdmin(res);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.error || 'Authentication failed. Check credentials.');
      }
    });
  }

  verifyOTP() {
    if (this.otp.length < 6) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.http.post<any>('/api/admin/login', {
      admin_id: this.email,
      password: this.password,
      otp: this.otp
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.token) {
          this.persistAdmin(res);
        } else {
          this.errorMsg.set('Invalid OTP. Please try again.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.error || 'Invalid 2FA code.');
      }
    });
  }

  private persistAdmin(res: any) {
    localStorage.setItem('civyx_token', res.token);
    localStorage.setItem('civyx_user', JSON.stringify(res.user));
    this.router.navigate(['/admin/dashboard']);
  }

  reset() {
    this.otpSent.set(false);
    this.otp = '';
    this.errorMsg.set('');
  }
}
