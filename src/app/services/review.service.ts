import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUri = '/api/reviews';

  constructor(private http: HttpClient) {}

  crearReview(data: { tradeId: string; rating: number; comment?: string }): Observable<any> {
    return this.http.post<any>(this.apiUri, data);
  }

  getReviewsUsuario(userId: string): Observable<{ promedio: number; total: number; reviews: any[] }> {
    return this.http.get<any>(`${this.apiUri}/usuario/${userId}`);
  }

  getPendiente(tradeId: string): Observable<{ puedeResenar: boolean; yaResenado: boolean }> {
    return this.http.get<any>(`${this.apiUri}/pendiente/${tradeId}`);
  }
}
