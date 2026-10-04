import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, NgIf],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>ABL API</h1>
        <p class="login-subtitle">Sign in to continue</p>

        <form
          (ngSubmit)="onLogin()"
          #loginForm="ngForm"
          action="/auth"
          method="POST"
        >
          <div class="form-group">
            <label for="username">User ID</label>
            <input
              id="username"
              type="text"
              [(ngModel)]="userId"
              name="username"
              placeholder="Enter your user ID (GUID)"
              required
              autocomplete="username"
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="password">Password / Token</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your token"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-primary" [disabled]="isLoading">
            <span *ngIf="isLoading">Signing in...</span>
            <span *ngIf="!isLoading">Sign In</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100%;
      width: 100%;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 2rem;
    }

    .login-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
    }

    .login-card h1 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      color: #1a1a2e;
    }

    .login-subtitle {
      margin: 0 0 2rem;
      color: #666;
      font-size: 0.95rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
      font-size: 0.9rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #4a90d9;
      box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
    }

    .error-message {
      background: #fee;
      color: #c00;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      border: 1px solid #fcc;
    }

    .btn-primary {
      width: 100%;
      padding: 0.875rem;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #16213e;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  userId = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  onLogin(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.userId, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Invalid credentials. Please check your user ID and token.';
        } else if (err.status === 429) {
          this.errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
