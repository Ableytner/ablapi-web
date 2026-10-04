import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgIf],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <div class="card-grid">
        <a routerLink="/gtnh" class="module-card">
          <img class="card-icon" src="https://cdn.ableytner.at/icon_gtnh.png" alt="GTNH" />
          <h2>GTNH</h2>
          <p>View GTNewHorizons build versions, including daily and stable releases.</p>
        </a>

        <a *ngIf="authService.hasWillhabenAccess" routerLink="/willhaben" class="module-card">
          <img class="card-icon" src="/logo-willhaben.png" alt="Willhaben" />
          <h2>Willhaben</h2>
          <p>Manage Willhaben.at search configurations and monitoring.</p>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 900px;
      margin: 0 auto;
    }

    .dashboard h1 {
      font-size: 2rem;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
      justify-content: center;
      align-items: start;
      margin-top: 0;
    }

    .module-card {
      display: block;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      padding: 2rem;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
    }

    .module-card:hover {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
      border-color: #4a90d9;
    }

    .card-icon {
      width: 64px;
      height: 64px;
      object-fit: contain;
      margin-bottom: 1rem;
    }

    .module-card h2 {
      margin: 0 0 0.5rem;
      font-size: 1.35rem;
      color: #1a1a2e;
    }

    .module-card p {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }
  `],
})
export class DashboardComponent implements OnInit {
  protected authService = inject(AuthService);

  ngOnInit(): void {
    // Guard is already applied via route config, but ensure auth state is fresh
  }
}
