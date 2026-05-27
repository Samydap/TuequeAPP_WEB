import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private perfilUri   = '/api/upload/imagenes';
  private articuloUri = '/api/upload/articulos';

  constructor(private http: HttpClient) {}

  /**
   * Sube una foto de perfil.
   * @returns Observable con { urls: [string] }
   */
  subirFotoPerfil(file: File): Observable<{ urls: string[] }> {
    const formData = new FormData();
    formData.append('imagenes', file, file.name);
    return this.http.post<{ urls: string[] }>(this.perfilUri, formData);
  }

  /**
   * Sube una o varias imágenes de artículo.
   * @param files      Array de archivos a subir
   * @param articuloId (opcional) Si se provee, el backend persiste las URLs en el artículo
   * @returns Observable con { urls: string[] }
   */
  subirImagenesArticulo(
    files: File[],
    articuloId?: string
  ): Observable<{ urls: string[] }> {
    const formData = new FormData();
    files.forEach(f => formData.append('imagenes', f, f.name));
    if (articuloId) {
      formData.append('articuloId', articuloId);
    }
    return this.http.post<{ urls: string[] }>(this.articuloUri, formData);
  }
}
