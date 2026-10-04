import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WillhabenConfigDto, CreateWillhabenConfigDto } from '../models/willhaben.model';

@Injectable({
  providedIn: 'root',
})
export class WillhabenService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/willhaben`;

  getConfigs(): Observable<WillhabenConfigDto[]> {
    return this.http.get<WillhabenConfigDto[]>(`${this.baseUrl}/config`);
  }

  createConfig(config: CreateWillhabenConfigDto): Observable<WillhabenConfigDto> {
    return this.http.post<WillhabenConfigDto>(`${this.baseUrl}/config`, config);
  }

  updateConfig(name: string, config: CreateWillhabenConfigDto): Observable<WillhabenConfigDto> {
    return this.http.post<WillhabenConfigDto>(`${this.baseUrl}/config/${name}`, config);
  }

  deleteConfig(name: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/config/${name}`);
  }
}
