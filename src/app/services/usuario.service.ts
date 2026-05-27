import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiUri = '/api/usuarios';

  /** Emite el usuario actualizado tras cada PUT exitoso */
  private perfilActualizado$ = new Subject<any>();
  perfilActualizado = this.perfilActualizado$.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUri);
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUri}/${id}`);
  }

  actualizar(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUri}/${id}`, data).pipe(
      tap((res) => {
        if (res?.usuario) this.perfilActualizado$.next(res.usuario);
      })
    );
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUri}/${id}`);
  }
}
