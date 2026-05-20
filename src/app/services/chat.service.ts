import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

export interface Participante {
  _id: string;
  nombre: string;
  foto?: string;
}

export interface Mensaje {
  _id: string;
  conversacion: string;
  remitente: Participante;
  contenido: string;
  leido: boolean;
  createdAt: string;
}

export interface Conversacion {
  _id: string;
  participantes: Participante[];
  intercambio?: any;
  ultimoMensaje?: Mensaje;
  activa: boolean;
  updatedAt: string;
}

export interface PaginacionMensajes {
  mensajes: Mensaje[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    paginas: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private apiUri = '/api/chat';
  private socket!: Socket;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ─── REST ────────────────────────────────────────────────────

  crearOObtenerConversacion(receptorId: string, intercambioId?: string): Observable<Conversacion> {
    return this.http.post<Conversacion>(`${this.apiUri}/conversaciones`, {
      receptorId,
      ...(intercambioId ? { intercambioId } : {})
    });
  }

  getMisConversaciones(): Observable<Conversacion[]> {
    return this.http.get<Conversacion[]>(`${this.apiUri}/conversaciones`);
  }

  getMensajes(conversacionId: string, pagina = 1, limite = 30): Observable<PaginacionMensajes> {
    return this.http.get<PaginacionMensajes>(
      `${this.apiUri}/conversaciones/${conversacionId}/mensajes`,
      { params: { pagina: pagina.toString(), limite: limite.toString() } }
    );
  }

  getNoLeidos(): Observable<{ noLeidos: number }> {
    return this.http.get<{ noLeidos: number }>(`${this.apiUri}/no-leidos`);
  }

  // ─── SOCKET.IO ───────────────────────────────────────────────

  conectar(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getToken();
    this.socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => console.log('[Chat] Socket conectado'));
    this.socket.on('disconnect', () => console.log('[Chat] Socket desconectado'));
    this.socket.on('error_chat', (err: any) => console.error('[Chat] Error socket:', err));
  }

  desconectar(): void {
    this.socket?.disconnect();
  }

  unirseConversacion(conversacionId: string): void {
    this.socket.emit('unirse_conversacion', conversacionId);
  }

  salirConversacion(conversacionId: string): void {
    this.socket.emit('salir_conversacion', conversacionId);
  }

  enviarMensaje(conversacionId: string, contenido: string): void {
    this.socket.emit('enviar_mensaje', { conversacionId, contenido });
  }

  emitirEscribiendo(conversacionId: string, escribiendo: boolean): void {
    this.socket.emit('escribiendo', { conversacionId, escribiendo });
  }

  marcarLeidos(conversacionId: string): void {
    this.socket.emit('marcar_leidos', { conversacionId });
  }

  // ─── ESCUCHAR EVENTOS ────────────────────────────────────────

  onNuevoMensaje(): Observable<Mensaje> {
    return new Observable(obs => {
      this.socket.on('nuevo_mensaje', (msg: Mensaje) => obs.next(msg));
      return () => this.socket.off('nuevo_mensaje');
    });
  }

  onUsuarioEscribiendo(): Observable<{ usuarioId: string; nombre: string; escribiendo: boolean }> {
    return new Observable(obs => {
      this.socket.on('usuario_escribiendo', (data: any) => obs.next(data));
      return () => this.socket.off('usuario_escribiendo');
    });
  }

  onMensajesLeidos(): Observable<{ conversacionId: string; leidoPor: string }> {
    return new Observable(obs => {
      this.socket.on('mensajes_leidos', (data: any) => obs.next(data));
      return () => this.socket.off('mensajes_leidos');
    });
  }

  onNotificacionMensaje(): Observable<{ conversacion: string; remitente: any; preview: string }> {
    return new Observable(obs => {
      this.socket.on('notificacion_mensaje', (data: any) => obs.next(data));
      return () => this.socket.off('notificacion_mensaje');
    });
  }

  onUnidoAConversacion(): Observable<{ conversacionId: string }> {
    return new Observable(obs => {
      this.socket.on('unido_a_conversacion', (data: any) => obs.next(data));
      return () => this.socket.off('unido_a_conversacion');
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  ngOnDestroy(): void {
    this.desconectar();
  }
}
