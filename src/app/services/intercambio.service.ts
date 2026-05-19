import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IntercambioService {
  private apiUri = '/api/intercambios';

  constructor(private http: HttpClient) {}

  getMisIntercambios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUri);
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUri}/${id}`);
  }

  crear(data: { articuloOfrecido: string; articuloDeseado: string; mensaje?: string }): Observable<any> {
    return this.http.post<any>(this.apiUri, data);
  }

  actualizarEstado(id: string, estado: string): Observable<any> {
    return this.http.put<any>(`${this.apiUri}/${id}`, { estado });
  }

  cancelar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUri}/${id}`);
  }
}
