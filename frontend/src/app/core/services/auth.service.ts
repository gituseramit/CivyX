import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer';
  ward_id?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'civyx_token';
  private readonly USER_KEY  = 'civyx_user';

  // Reactive signals
  currentUser = signal<User | null>(this.loadUser());
  isLoggedIn  = computed(() => this.currentUser() !== null);
  isOfficer   = computed(() => this.currentUser()?.role === 'officer');
  isCitizen   = computed(() => this.currentUser()?.role === 'citizen');

  constructor(private http: HttpClient, private router: Router) {}

  register(name: string, email: string, password: string, role: string, wardId?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { name, email, password, role, ward_id: wardId })
      .pipe(tap(res => this.persist(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap(res => this.persist(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
