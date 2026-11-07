import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MinecraftServerDto } from '../models/minecraft.model';

/**
 * Client for the Minecraft server scan endpoint.
 *
 * NOTE: This service intentionally uses a *relative* URL (`/api/minecraft/scan`)
 * so the request is served by the same-origin Node.js SSR server (which performs
 * the actual LAN scan), rather than the external `ablapi` backend.
 */
@Injectable({
  providedIn: 'root',
})
export class MinecraftService {
  private http = inject(HttpClient);

  /**
   * Request a scan. With `forceFull` the backend rescans the entire port range
   * (bypassing its candidate-port cache), which is what the "Re-scan" button
   * uses to pick up servers that were missed earlier.
   */
  scan(forceFull = false): Observable<MinecraftServerDto[]> {
    const url = forceFull
      ? '/api/minecraft/scan?full=1'
      : '/api/minecraft/scan';
    return this.http.get<MinecraftServerDto[]>(url);
  }
}
