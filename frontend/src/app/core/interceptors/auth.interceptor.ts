import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  let request = req;
  if (token) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Do not intercept 401s for login routes, let components handle them natively to show error messages
      if (error.status === 401 && !req.url.includes('/login')) {
        localStorage.removeItem('civyx_token');
        localStorage.removeItem('civyx_user');
        
        // Route to the appropriate login based on the URL
        if (req.url.includes('/admin/')) {
          router.navigate(['/admin/login']);
        } else {
          const currentUrl = router.url;
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        }
      }
      return throwError(() => error);
    })
  );
};
