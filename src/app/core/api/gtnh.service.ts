import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyVersionDto, StableVersionDto } from '../models/gtnh.model';

@Injectable({
  providedIn: 'root',
})
export class GtnhService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/gtnh`;

  getLatestDaily(): Observable<DailyVersionDto> {
    return this.http.get<DailyVersionDto>(`${this.baseUrl}/daily/latest`);
  }

  getDailyByRun(runNumber: number): Observable<DailyVersionDto> {
    return this.http.get<DailyVersionDto>(`${this.baseUrl}/daily/${runNumber}`);
  }

  getLatestStable(): Observable<StableVersionDto> {
    return this.http.get<StableVersionDto>(`${this.baseUrl}/stable/latest`);
  }

  getStableByVersion(version: string): Observable<StableVersionDto> {
    return this.http.get<StableVersionDto>(`${this.baseUrl}/stable/${version}`);
  }
}
