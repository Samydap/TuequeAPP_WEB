import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ArticuloService {
  private apiUri = '/api/articulos';

  constructor(private http: HttpClient) {}

  getAll(filtros?: { categoria?: string; estado?: string }): Observable<any[]> {
    let params: any = {};
    if (filtros?.categoria) params['categoria'] = filtros.categoria;
    if (filtros?.estado) params['estado'] = filtros.estado;
    return this.http.get<any[]>(this.apiUri, { params });
  }

  getOne(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUri}/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.http.post<any>(this.apiUri, data);
  }

  actualizar(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUri}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUri}/${id}`);
  }
}
