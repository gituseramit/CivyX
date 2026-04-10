import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
  { path: '**', redirectTo: '' }
];
