import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ward {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  health_score: number;
  color: 'green' | 'yellow' | 'red';
  updated_at: string;
}

export interface WardStats {
  ward: { id: string; name: string; city: string; health_score: number; color: string };
  total: number;
  resolved: number;
  in_progress: number;
  pending: number;
  categories: { category: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class WardService {
  constructor(private http: HttpClient) {}

  list(): Observable<Ward[]> {
    return this.http.get<Ward[]>('/api/wards');
  }

  getStats(id: string): Observable<WardStats> {
    return this.http.get<WardStats>(`/api/wards/${id}/stats`);
  }
}
