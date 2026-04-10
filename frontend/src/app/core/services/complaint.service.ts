import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Complaint {
  id: string;
  title: string;
  description?: string;
  category: string;
  severity: number;
  status: string;
  department: string;
  lat?: number;
  lng?: number;
  ai_classified: boolean;
  created_at: string;
  updated_at: string;
  ward_name?: string;
  user_name?: string;
}

export interface ComplaintDetail extends Complaint {
  description: string;
  ward_id: string;
  user_id: string;
}

export interface TimelineEntry {
  status: string;
  note?: string;
  changed_at: string;
  changed_by?: string;
}

export interface SubmitComplaintPayload {
  description?: string;
  audio_base64?: string;
  audio_name?: string;
  ward_id: string;
  lat?: number;
  lng?: number;
}

export interface SubmitComplaintResponse {
  id: string;
  title: string;
  category: string;
  severity: number;
  department: string;
  status: string;
  ai_classified: boolean;
  summary?: string;
}

@Injectable({ providedIn: 'root' })
export class ComplaintService {
  constructor(private http: HttpClient) {}

  submit(payload: SubmitComplaintPayload): Observable<SubmitComplaintResponse> {
    return this.http.post<SubmitComplaintResponse>('/api/complaints', payload);
  }

  list(filters: { ward_id?: string; status?: string; category?: string } = {}): Observable<Complaint[]> {
    let params = new HttpParams();
    if (filters.ward_id)  params = params.set('ward_id', filters.ward_id);
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);
    return this.http.get<Complaint[]>('/api/complaints', { params });
  }

  getById(id: string): Observable<{ complaint: ComplaintDetail; timeline: TimelineEntry[] }> {
    return this.http.get<{ complaint: ComplaintDetail; timeline: TimelineEntry[] }>(`/api/complaints/${id}`);
  }

  mine(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>('/api/complaints/mine');
  }

  updateStatus(id: string, status: string, note?: string): Observable<any> {
    return this.http.patch(`/api/complaints/${id}/status`, { status, note });
  }

  // Officer
  officerList(filters: { ward_id?: string; status?: string; category?: string } = {}): Observable<any[]> {
    let params = new HttpParams();
    if (filters.ward_id)  params = params.set('ward_id', filters.ward_id);
    if (filters.status)   params = params.set('status', filters.status);
    if (filters.category) params = params.set('category', filters.category);
    return this.http.get<any[]>('/api/officer/complaints', { params });
  }

  officerStats(): Observable<{ total: number; pending: number; in_progress: number; resolved_today: number }> {
    return this.http.get<any>('/api/officer/stats');
  }
}
