import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const user   = auth.currentUser();
  const required = route.data?.['role'] as string | undefined;

  if (!required || user?.role === required) return true;

  // Redirect to appropriate home based on actual role
  const home = user?.role === 'officer' ? '/officer-dashboard' : '/my-complaints';
  router.navigate([home]);
  return false;
};
