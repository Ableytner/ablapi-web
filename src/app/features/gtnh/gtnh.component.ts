import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgIf } from '@angular/common';
import { GtnhService } from '../../core/api/gtnh.service';
import { DailyVersionDto, StableVersionDto, Downloads } from '../../core/models/gtnh.model';

@Component({
  selector: 'app-gtnh',
  imports: [FormsModule, DatePipe, NgIf],
  template: `
    <div class="gtnh-page">
      <h1>GTNH</h1>
      <p class="page-subtitle">GTNewHorizons Minecraft Modpack Build Versions</p>

      <div class="cards-grid">
        <!-- Latest Daily Build -->
        <div class="info-card">
          <h2>Latest Daily Build</h2>
          <div *ngIf="dailyLoading" class="loading">Loading...</div>
          <div *ngIf="dailyError" class="error">{{ dailyError }}</div>
          <div *ngIf="dailyVersion && !dailyLoading">
            <div class="info-row">
              <span class="label">Version:</span>
              <span class="value">{{ dailyVersion.version }}</span>
            </div>
            <div class="info-row">
              <span class="label">Run #:</span>
              <span class="value">{{ dailyVersion.run_number }}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" [class.success]="dailyVersion.success" [class.failure]="!dailyVersion.success">
                {{ dailyVersion.success ? 'Successful' : 'Failed' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">{{ dailyVersion.created_at | date:'medium' }}</span>
            </div>
            <div class="download-links">
              <h3>Downloads</h3>
              <a [href]="dailyVersion.downloads.client" target="_blank" rel="noopener">Client</a>
              <a [href]="dailyVersion.downloads.client_java8" target="_blank" rel="noopener">Client (Java 8)</a>
              <a [href]="dailyVersion.downloads.server" target="_blank" rel="noopener">Server</a>
              <a [href]="dailyVersion.downloads.server_java8" target="_blank" rel="noopener">Server (Java 8)</a>
            </div>
            <div class="run-link">
              <a [href]="dailyVersion.run_url_html" target="_blank" rel="noopener">View on GitHub</a>
            </div>
          </div>
        </div>

        <!-- Latest Stable Build -->
        <div class="info-card">
          <h2>Latest Stable Build</h2>
          <div *ngIf="stableLoading" class="loading">Loading...</div>
          <div *ngIf="stableError" class="error">{{ stableError }}</div>
          <div *ngIf="stableVersion && !stableLoading">
            <div class="info-row">
              <span class="label">Version:</span>
              <span class="value">{{ stableVersion.version }}</span>
            </div>
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">{{ stableVersion.created_at | date:'medium' }}</span>
            </div>
            <div class="download-links">
              <h3>Downloads</h3>
              <a [href]="stableVersion.downloads.client" target="_blank" rel="noopener">Client</a>
              <a [href]="stableVersion.downloads.client_java8" target="_blank" rel="noopener">Client (Java 8)</a>
              <a [href]="stableVersion.downloads.server" target="_blank" rel="noopener">Server</a>
              <a [href]="stableVersion.downloads.server_java8" target="_blank" rel="noopener">Server (Java 8)</a>
            </div>
          </div>
        </div>

        <!-- Specific Daily Run -->
        <div class="info-card">
          <h2>Specific Daily Run</h2>
          <div class="run-input">
            <input
              type="number"
              [(ngModel)]="runNumber"
              placeholder="Enter run number"
              (keyup.enter)="fetchDailyRun()"
            />
            <button (click)="fetchDailyRun()" [disabled]="runNumberLoading">
              {{ runNumberLoading ? 'Loading...' : 'Fetch' }}
            </button>
          </div>
          <div *ngIf="runError" class="error">{{ runError }}</div>
          <div *ngIf="runVersion && !runNumberLoading">
            <div class="info-row">
              <span class="label">Version:</span>
              <span class="value">{{ runVersion.version }}</span>
            </div>
            <div class="info-row">
              <span class="label">Run #:</span>
              <span class="value">{{ runVersion.run_number }}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" [class.success]="runVersion.success" [class.failure]="!runVersion.success">
                {{ runVersion.success ? 'Successful' : 'Failed' }}
              </span>
            </div>
            <div class="download-links">
              <h3>Downloads</h3>
              <a [href]="runVersion.downloads.client" target="_blank" rel="noopener">Client</a>
              <a [href]="runVersion.downloads.client_java8" target="_blank" rel="noopener">Client (Java 8)</a>
              <a [href]="runVersion.downloads.server" target="_blank" rel="noopener">Server</a>
              <a [href]="runVersion.downloads.server_java8" target="_blank" rel="noopener">Server (Java 8)</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gtnh-page {
      max-width: 1100px;
      margin: 0 auto;
    }

    .gtnh-page h1 {
      font-size: 2rem;
      color: #1a1a2e;
      margin-bottom: 0.25rem;
    }

    .page-subtitle {
      color: #666;
      margin-bottom: 2rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .info-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .info-card h2 {
      margin: 0 0 1rem;
      font-size: 1.25rem;
      color: #1a1a2e;
    }

    .loading {
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

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .label {
      color: #666;
      font-weight: 500;
    }

    .value {
      color: #333;
    }

    .value.success {
      color: #1a7a1a;
      font-weight: 600;
    }

    .value.failure {
      color: #c00;
      font-weight: 600;
    }

    .download-links {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e8e8e8;
    }

    .download-links h3 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
      color: #1a1a2e;
    }

    .download-links a {
      display: block;
      padding: 0.35rem 0;
      color: #4a90d9;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .download-links a:hover {
      text-decoration: underline;
    }

    .run-link {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e8e8e8;
    }

    .run-link a {
      color: #4a90d9;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .run-link a:hover {
      text-decoration: underline;
    }

    .run-input {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .run-input input {
      flex: 1;
      padding: 0.6rem 0.8rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .run-input input:focus {
      outline: none;
      border-color: #4a90d9;
    }

    .run-input button {
      padding: 0.6rem 1.2rem;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95rem;
      white-space: nowrap;
    }

    .run-input button:hover:not(:disabled) {
      background: #16213e;
    }

    .run-input button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class GtnhComponent implements OnInit {
  private gtnhService = inject(GtnhService);

  dailyVersion: DailyVersionDto | null = null;
  dailyLoading = false;
  dailyError = '';

  stableVersion: StableVersionDto | null = null;
  stableLoading = false;
  stableError = '';

  runVersion: DailyVersionDto | null = null;
  runNumber = '';
  runNumberLoading = false;
  runError = '';

  ngOnInit(): void {
    this.loadLatestDaily();
    this.loadLatestStable();
  }

  loadLatestDaily(): void {
    this.dailyLoading = true;
    this.dailyError = '';
    this.gtnhService.getLatestDaily().subscribe({
      next: (data) => { this.dailyVersion = data; this.dailyLoading = false; },
      error: (err) => { this.dailyError = 'Failed to load latest daily build.'; this.dailyLoading = false; },
    });
  }

  loadLatestStable(): void {
    this.stableLoading = true;
    this.stableError = '';
    this.gtnhService.getLatestStable().subscribe({
      next: (data) => { this.stableVersion = data; this.stableLoading = false; },
      error: (err) => { this.stableError = 'Failed to load latest stable build.'; this.stableLoading = false; },
    });
  }

  fetchDailyRun(): void {
    const runNum = parseInt(this.runNumber, 10);
    if (isNaN(runNum)) {
      this.runError = 'Please enter a valid run number.';
      return;
    }
    this.runError = '';
    this.runVersion = null;
    this.runNumberLoading = true;
    this.gtnhService.getDailyByRun(runNum).subscribe({
      next: (data) => { this.runVersion = data; this.runNumberLoading = false; },
      error: () => { this.runError = 'Run not found or failed to load.'; this.runNumberLoading = false; },
    });
  }
}
