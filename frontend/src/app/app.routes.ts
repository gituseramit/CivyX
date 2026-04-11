import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'submit-complaint',
    loadComponent: () => import('./pages/submit-complaint/submit-complaint.component').then(m => m.SubmitComplaintComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-complaints',
    loadComponent: () => import('./pages/my-complaints/my-complaints.component').then(m => m.MyComplaintsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'citizen' }
  },
  {
    path: 'ward-map',
    loadComponent: () => import('./pages/ward-map/ward-map.component').then(m => m.WardMapComponent)
  },
  {
    path: 'officer-dashboard',
    loadComponent: () => import('./pages/officer-dashboard/officer-dashboard.component').then(m => m.OfficerDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'officer' }
  },
  {
    path: 'public-feed',
    loadComponent: () => import('./pages/public-feed/public-feed.component').then(m => m.PublicFeedComponent)
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
  },
  {
    path: 'verify/:id',
    loadComponent: () => import('./pages/public-verification/public-verification.component').then(m => m.PublicVerificationComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'officers',
        loadComponent: () => import('./pages/admin/officers/officer-verification.component').then(m => m.OfficerVerificationComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./pages/admin/audit-logs/admin-audit-logs.component').then(m => m.AdminAuditLogsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
