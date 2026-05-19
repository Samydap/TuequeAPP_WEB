import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUri = '/api/auth';

  constructor(private http: HttpClient) {}

  registro(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUri}/registro`, data).pipe(
      tap((res) => this.guardarSesion(res))
    );
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUri}/login`, data).pipe(
      tap((res) => this.guardarSesion(res))
    );
  }

  private guardarSesion(res: any) {
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUsuario(): any {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  estaAutenticado(): boolean {
    return !!this.getToken();
  }
}
