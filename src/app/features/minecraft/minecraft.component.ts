import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MinecraftService } from '../../core/api/minecraft.service';
import { MinecraftServerDto } from '../../core/models/minecraft.model';

/**
 * Displays Minecraft servers discovered on the LAN host, as cards sorted by
 * descending player count. The scan itself is performed server-side by the
 * Node.js SSR server (see `src/server/minecraft/scan.ts`).
 */
@Component({
  selector: 'app-minecraft',
  imports: [DatePipe],
  template: `
    <div class="mc-page">
      <div class="page-header">
        <div>
          <h1>Minecraft</h1>
          <p class="page-subtitle">Minecraft servers on 192.168.0.11 (ports 25566–25666)</p>
        </div>
        <button class="btn-primary" (click)="scan()" [disabled]="loading">
          {{ loading ? 'Scanning…' : 'Re-scan' }}
        </button>
      </div>

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (loading && servers.length === 0) {
        <div class="loading">Scanning for Minecraft servers…</div>
      }

      @if (!loading && servers.length === 0) {
        <div class="empty">No Minecraft servers found.</div>
      }

      <div class="cards-grid">
        @for (server of servers; track server.port) {
          <div class="server-card">
            <div class="server-header">
              @if (server.favicon) {
                <img class="favicon" [src]="server.favicon" alt="Server favicon" />
              } @else {
                <div class="favicon placeholder">MC</div>
              }
              <div class="server-title">
                <span class="server-name">{{ server.host }}:{{ server.port }}</span>
                <span class="version-badge">{{ server.version }}</span>
              </div>
            </div>

            <div class="motd" [innerHTML]="formatMotd(server.motd)"></div>

            <div class="server-meta">
              <div class="meta-item">
                <span class="meta-label">Players</span>
                <span class="meta-value">
                  {{ server.playersOnline }} / {{ server.playersMax }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Ping</span>
                <span class="meta-value" [class.good]="server.pingMs < 50" [class.warn]="server.pingMs >= 50 && server.pingMs < 150" [class.bad]="server.pingMs >= 150">
                  {{ server.pingMs }} ms
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      @if (lastUpdated) {
        <p class="last-updated">Last updated: {{ lastUpdated | date: 'medium' }}</p>
      }
    </div>
  `,
  styles: [`
    .mc-page {
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .mc-page h1 {
      font-size: 2rem;
      color: #1a1a2e;
      margin: 0 0 0.25rem;
    }

    .page-subtitle {
      color: #666;
      margin: 0;
    }

    .btn-primary {
      padding: 0.6rem 1.2rem;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      white-space: nowrap;
    }

    .btn-primary:hover:not(:disabled) {
      background: #16213e;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading,
    .empty {
      color: #666;
      padding: 2rem 0;
      text-align: center;
    }

    .error {
      color: #c00;
      background: #fee;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      border: 1px solid #fcc;
      margin-bottom: 1rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .server-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .server-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .favicon {
      width: 48px;
      height: 48px;
      object-fit: contain;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .favicon.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .server-title {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .server-name {
      font-weight: 600;
      color: #1a1a2e;
      font-size: 1rem;
      word-break: break-all;
    }

    .version-badge {
      align-self: flex-start;
      background: #eef2f7;
      color: #4a6b8a;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
    }

    .motd {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      line-height: 1.4;
      color: #333;
      word-break: break-word;
      min-height: 1.2em;
    }

    .server-meta {
      display: flex;
      gap: 1.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f0f0f0;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .meta-label {
      color: #666;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-value {
      color: #333;
      font-weight: 600;
    }

    .meta-value.good { color: #1a7a1a; }
    .meta-value.warn { color: #b8860b; }
    .meta-value.bad  { color: #c00; }

    .last-updated {
      color: #999;
      font-size: 0.8rem;
      margin-top: 2rem;
      text-align: center;
    }

    /*
     * Minecraft MOTD color / formatting classes.
     * These are applied to spans produced by the formatMotd method and injected
     * via innerHTML. Because dynamically-injected HTML is not subject to view
     * encapsulation, ::ng-deep is required for these rules to match.
     */
    .motd ::ng-deep .mc-c0 { color: #000000; }
    .motd ::ng-deep .mc-c1 { color: #0000AA; }
    .motd ::ng-deep .mc-c2 { color: #00AA00; }
    .motd ::ng-deep .mc-c3 { color: #AA0000; }
    .motd ::ng-deep .mc-c4 { color: #00AAAA; }
    .motd ::ng-deep .mc-c5 { color: #AA00AA; }
    .motd ::ng-deep .mc-c6 { color: #FFAA00; }
    .motd ::ng-deep .mc-c7 { color: #AAAAAA; }
    .motd ::ng-deep .mc-c8 { color: #555555; }
    .motd ::ng-deep .mc-c9 { color: #5555FF; }
    .motd ::ng-deep .mc-ca { color: #55FF55; }
    .motd ::ng-deep .mc-cb { color: #FF5555; }
    .motd ::ng-deep .mc-cc { color: #55FFFF; }
    .motd ::ng-deep .mc-cd { color: #FF55FF; }
    .motd ::ng-deep .mc-ce { color: #FFFF55; }
    .motd ::ng-deep .mc-cf { color: #FFFFFF; }
    .motd ::ng-deep .mc-b { font-weight: 700; }
    .motd ::ng-deep .mc-i { font-style: italic; }
    .motd ::ng-deep .mc-u { text-decoration: underline; }
    .motd ::ng-deep .mc-s { text-decoration: line-through; }
  `],
})
export class MinecraftComponent implements OnInit {
  private minecraftService = inject(MinecraftService);

  servers: MinecraftServerDto[] = [];
  loading = false;
  error = '';
  lastUpdated: Date | null = null;

  // Standard Minecraft § color codes → hex.
  private static readonly COLORS: Record<string, string> = {
    '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#AA0000',
    '4': '#00AAAA', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
    '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#FF5555',
    'c': '#55FFFF', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
  };

  ngOnInit(): void {
    this.scan();
  }

  scan(): void {
    this.loading = true;
    this.error = '';
    this.minecraftService.scan().subscribe({
      next: (data) => {
        // The backend already sorts descending, but re-sort here to guarantee
        // the order regardless of the data source.
        this.servers = [...data].sort((a, b) => b.playersOnline - a.playersOnline);
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to scan for Minecraft servers.';
        this.loading = false;
      },
    });
  }

  /**
   * Convert a raw MOTD (with `§` color/formatting codes) into safe HTML with
   * colored `<span>`s. Text is HTML-escaped so it can be used with `[innerHTML]`.
   */
  formatMotd(motd: string): string {
    if (!motd) return '<span style="color:#999">&mdash;</span>';
    const lines = motd.split(/\r?\n/);
    return lines.map((line) => this.formatMotdLine(line)).join('<br>');
  }

  private formatMotdLine(line: string): string {
    let html = '';
    let color = '';
    let bold = false;
    let italic = false;
    let underline = false;
    let strikethrough = false;
    let buffer = '';

    const flush = () => {
      if (buffer.length === 0) return;
      const escaped = MinecraftComponent.escapeHtml(buffer);
      const classes: string[] = [];
      if (color) classes.push(`mc-c${color}`);
      if (bold) classes.push('mc-b');
      if (italic) classes.push('mc-i');
      if (underline) classes.push('mc-u');
      if (strikethrough) classes.push('mc-s');
      if (classes.length > 0) {
        html += `<span class="${classes.join(' ')}">${escaped}</span>`;
      } else {
        html += escaped;
      }
      buffer = '';
    };

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '§' && i + 1 < line.length) {
        const code = line[i + 1].toLowerCase();
        i++; // skip the code char
        if (MinecraftComponent.COLORS[code] !== undefined) {
          flush();
          color = code;
        } else if (code === 'k') {
          // obfuscated — no CSS equivalent, ignore
        } else if (code === 'l') {
          flush();
          bold = true;
        } else if (code === 'm') {
          flush();
          strikethrough = true;
        } else if (code === 'n') {
          flush();
          underline = true;
        } else if (code === 'o') {
          flush();
          italic = true;
        } else if (code === 'r') {
          flush();
          color = '';
          bold = italic = underline = strikethrough = false;
        }
        // Unknown codes are ignored.
      } else {
        buffer += ch;
      }
    }
    flush();

    return html;
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
