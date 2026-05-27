import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totales: {
    articulos: number;
    usuarios: number;
    intercambios: number;
  };
  articulosPorEstado:    { _id: string; total: number }[];
  articulosPorCategoria: { _id: string; nombre: string; total: number }[];
  ultimosArticulos:      any[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUri = '/api/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUri);
  }
}
