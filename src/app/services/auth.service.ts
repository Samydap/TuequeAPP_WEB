import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUri = '/api/auth';

  /** Emite la URL de foto cada vez que cambia → Navbar y listado se sincronizan */
  private fotoSubject = new BehaviorSubject<string>(this.getFotoActual());
  foto$ = this.fotoSubject.asObservable();

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
      this.fotoSubject.next(res.usuario?.foto || '');
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.fotoSubject.next('');
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

  /**
   * Actualiza el objeto de sesión en localStorage y notifica a todos
   * los suscriptores de foto$ (Navbar, lista de usuarios, etc.)
   */
  actualizarSesionLocal(parcial: Partial<{ nombre: string; foto: string; telefono: string; direccion: string }>) {
    const actual = this.getUsuario() || {};
    const nuevo  = { ...actual, ...parcial };
    localStorage.setItem('usuario', JSON.stringify(nuevo));
    if (parcial.foto !== undefined) {
      this.fotoSubject.next(parcial.foto);
    }
  }

  private getFotoActual(): string {
    try {
      const u = localStorage.getItem('usuario');
      return u ? JSON.parse(u)?.foto || '' : '';
    } catch {
      return '';
    }
  }
}
