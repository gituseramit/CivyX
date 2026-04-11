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
  readonly apiUrl = '/api';

  // Reactive signals
  currentUser = signal<User | null>(this.loadUser());
  isLoggedIn  = computed(() => this.currentUser() !== null);
  isOfficer   = computed(() => this.currentUser()?.role === 'officer');
  isCitizen   = computed(() => this.currentUser()?.role === 'citizen');

  constructor(private http: HttpClient, private router: Router) {}

  register(
    name: string, 
    email: string, 
    password: string, 
    role: string, 
    extra?: { wardId?: string, employeeId?: string, designation?: string, department?: string }
  ): Observable<AuthResponse> {
    const payload = { 
      name, 
      email, 
      password, 
      role, 
      ward_id: extra?.wardId,
      employee_id: extra?.employeeId,
      designation: extra?.designation,
      department_name: extra?.department
    };
    return this.http.post<AuthResponse>('/api/auth/register', payload)
      .pipe(tap(res => this.persist(res)));
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post('/api/auth/login', { email, password }).pipe(
      tap((res: any) => this.persist(res))
    );
  }

  adminLogin(admin_id: string, password: string, otp?: string): Observable<any> {
    const payload: any = { admin_id, password };
    if (otp) payload.otp = otp;
    return this.http.post('/api/admin/login', payload);
  }

  adminLogout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/admin/login']);
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
