import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      const status: number = err.status;
      const message: string =
        err.error?.message ?? err.statusText ?? 'An unexpected error occurred';

      if (status === 403) {
        router.navigate(['/unauthorized']);
      } else if (status === 404) {
        router.navigate(['/not-found']);
      } else if (status === 0) {
        console.error('[Network] Cannot reach server');
      }

      // Re-throw enriched error
      return throwError(() => ({ status, message, originalError: err }));
    })
  );
};
