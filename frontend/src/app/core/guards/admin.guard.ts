import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('civyx_user') || '{}');
  const token = localStorage.getItem('civyx_token');

  if (token && user.admin_role) {
    return true;
  }

  // Redirect to admin login if not authorized
  router.navigate(['/admin/login']);
  return false;
};
