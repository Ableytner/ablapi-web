import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    @if (isAuthenticated()) {
      <header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <a routerLink="/dashboard">ABL API</a>
          </h1>
          <nav class="app-nav">
            <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            <button class="btn-logout" (click)="logout()">Logout</button>
          </nav>
        </div>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-header {
      background: #1a1a2e;
      color: #fff;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-title a {
      color: #fff;
      text-decoration: none;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .app-nav {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .app-nav a {
      color: #e0e0e0;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .app-nav a:hover,
    .app-nav a.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .btn-logout:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .app-main {
      display: flex;
      flex-direction: column;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      padding: 2rem 2rem 0 2rem;
    }
  `],
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
