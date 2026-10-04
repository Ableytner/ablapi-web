import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'gtnh', canActivate: [authGuard], loadComponent: () => import('./features/gtnh/gtnh.component').then(m => m.GtnhComponent) },
  { path: 'willhaben', canActivate: [authGuard], loadComponent: () => import('./features/willhaben/willhaben.component').then(m => m.WillhabenComponent) },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
