import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/auth.model';
import { clearAuthCookie, getAuthCookie, setAuthCookie } from './cookie.util';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenSignal = signal<string | null>(null);
  private rolesSignal = signal<string[]>([]);

  readonly token = this.tokenSignal.asReadonly();
  readonly roles = this.rolesSignal.asReadonly();

  hasWillhabenAccess = false;
  hasAdminAccess = false;

  constructor(private http: HttpClient) {}

  login(userId: string, token: string): Observable<AuthResponse> {
    const credentials = btoa(`${userId}:${token}`);
    const headers = new HttpHeaders({
      Authorization: `Basic ${credentials}`,
    });

    return this.http.post<AuthResponse>(this.apiUrl, null, { headers }).pipe(
      tap((response) => {
        this.tokenSignal.set(response.token);
        this.decodeRoles(response.token);
        setAuthCookie(response.token, response.expires_at);
      })
    );
  }

  /**
   * Restore the session from the auth cookie on app startup so that a page
   * refresh does not log the user out. Clears the cookie if the stored token
   * is already expired.
   */
  restore(): void {
    const token = getAuthCookie();
    if (!token) {
      return;
    }
    if (this.isExpired(token)) {
      clearAuthCookie();
      return;
    }
    this.tokenSignal.set(token);
    this.decodeRoles(token);
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.rolesSignal.set([]);
    this.hasWillhabenAccess = false;
    this.hasAdminAccess = false;
    clearAuthCookie();
  }

  isAuthenticated(): boolean {
    return this.tokenSignal() !== null;
  }

  /** Checks the JWT `exp` claim (seconds) against the current time. */
  private isExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const decoded = atob(base64 + (pad ? '='.repeat(4 - pad) : ''));
      const claims = JSON.parse(decoded);
      if (typeof claims.exp === 'number') {
        return claims.exp * 1000 <= Date.now();
      }
    } catch {
      // Unparseable token — treat as valid and let the API decide.
    }
    return false;
  }

  private decodeRoles(token: string): void {
    try {
      const payload = token.split('.')[1];
      // JWT uses Base64Url encoding; convert to standard Base64 for atob
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const decoded = atob(base64 + (pad ? '='.repeat(4 - pad) : ''));
      const claims = JSON.parse(decoded);
      // Support both singular 'role' and plural 'roles' claim names
      // The API may emit a single string (one role) or an array (multiple roles)
      let roles: string[];
      if (Array.isArray(claims.role)) {
        roles = claims.role;
      } else if (typeof claims.role === 'string') {
        roles = [claims.role];
      } else if (Array.isArray(claims.roles)) {
        roles = claims.roles;
      } else {
        roles = [];
      }
      console.log('Extracted roles:', roles);
      this.rolesSignal.set(roles);
      this.hasWillhabenAccess = roles.includes('WillhabenConfig') || roles.includes('Admin');
      this.hasAdminAccess = roles.includes('Admin');
    } catch (e) {
      console.error('Failed to decode JWT roles:', e);
      this.rolesSignal.set([]);
    }
  }
}
