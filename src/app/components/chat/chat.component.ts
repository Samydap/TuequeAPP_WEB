import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef,
  AfterViewChecked, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ChatService, Conversacion, Mensaje } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  conversaciones: Conversacion[] = [];
  conversacionActiva: Conversacion | null = null;
  mensajes: Mensaje[] = [];
  textoMensaje = '';
  cargandoMensajes = false;
  cargandoConversaciones = false;
  estaEscribiendo = false;
  nombreEscribiendo = '';
  escribiendoTimeout: any;
  debeScrollear = false;
  buscandoUsuario = '';
  usuarios: any[] = [];
  buscando = false;
  usuarioActual: any;

  private subs = new Subscription();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuario();
    this.chatService.conectar();
    this.cargarConversaciones();
    this.escucharEventosSocket();
  }

  ngAfterViewChecked(): void {
    if (this.debeScrollear) {
      this.scrollAlFinal();
      this.debeScrollear = false;
    }
  }

  ngOnDestroy(): void {
    if (this.conversacionActiva) {
      this.chatService.salirConversacion(this.conversacionActiva._id);
    }
    this.subs.unsubscribe();
  }

  // ─── Cargar conversaciones ────────────────────────────────────

  cargarConversaciones(): void {
    this.cargandoConversaciones = true;
    this.chatService.getMisConversaciones().subscribe({
      next: (data) => {
        this.conversaciones = data;
        this.cargandoConversaciones = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Error al cargar conversaciones');
        this.cargandoConversaciones = false;
      }
    });
  }

  // ─── Abrir conversación ───────────────────────────────────────

  abrirConversacion(conv: Conversacion): void {
    if (this.conversacionActiva?._id === conv._id) return;

    if (this.conversacionActiva) {
      this.chatService.salirConversacion(this.conversacionActiva._id);
    }

    this.conversacionActiva = conv;
    this.mensajes = [];
    this.estaEscribiendo = false;
    this.cargandoMensajes = true;

    this.chatService.unirseConversacion(conv._id);
    this.cargarMensajes(conv._id);
    this.chatService.marcarLeidos(conv._id);
  }

  cargarMensajes(conversacionId: string): void {
    this.chatService.getMensajes(conversacionId).subscribe({
      next: (data) => {
        this.mensajes = data.mensajes;
        this.cargandoMensajes = false;
        this.debeScrollear = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastr.error('Error al cargar mensajes');
        this.cargandoMensajes = false;
      }
    });
  }

  // ─── Enviar mensaje ───────────────────────────────────────────

  enviarMensaje(): void {
    const contenido = this.textoMensaje.trim();
    if (!contenido || !this.conversacionActiva) return;
    if (contenido.length > 1000) {
      this.toastr.warning('El mensaje no puede superar 1000 caracteres');
      return;
    }

    this.chatService.enviarMensaje(this.conversacionActiva._id, contenido);
    this.textoMensaje = '';
    this.emitirDejoDeEscribir();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    } else {
      this.emitirEscribiendo();
    }
  }

  // ─── Indicador "está escribiendo" ────────────────────────────

  private emitirEscribiendo(): void {
    if (!this.conversacionActiva) return;
    this.chatService.emitirEscribiendo(this.conversacionActiva._id, true);
    clearTimeout(this.escribiendoTimeout);
    this.escribiendoTimeout = setTimeout(() => this.emitirDejoDeEscribir(), 2500);
  }

  private emitirDejoDeEscribir(): void {
    if (!this.conversacionActiva) return;
    this.chatService.emitirEscribiendo(this.conversacionActiva._id, false);
    clearTimeout(this.escribiendoTimeout);
  }

  // ─── Escuchar eventos Socket.IO ───────────────────────────────

  private escucharEventosSocket(): void {
    this.subs.add(
      this.chatService.onNuevoMensaje().subscribe(msg => {
        if (msg.conversacion === this.conversacionActiva?._id) {
          this.mensajes = [...this.mensajes, msg];
          this.debeScrollear = true;
          this.chatService.marcarLeidos(this.conversacionActiva._id);
        }
        // Actualizar último mensaje en lista de conversaciones
        const idx = this.conversaciones.findIndex(c => c._id === msg.conversacion);
        if (idx !== -1) {
          this.conversaciones[idx].ultimoMensaje = msg;
          this.conversaciones = [...this.conversaciones];
        }
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.chatService.onUsuarioEscribiendo().subscribe(data => {
        if (data.usuarioId !== this.usuarioActual?.id) {
          this.estaEscribiendo = data.escribiendo;
          this.nombreEscribiendo = data.nombre;
          this.cdr.detectChanges();
        }
      })
    );

    this.subs.add(
      this.chatService.onNotificacionMensaje().subscribe(data => {
        if (data.conversacion !== this.conversacionActiva?._id) {
          this.toastr.info(
            `"${data.preview}"`,
            `Mensaje de ${data.remitente.nombre}`,
            { timeOut: 3000, positionClass: 'toast-bottom-right' }
          );
          this.cargarConversaciones();
        }
      })
    );
  }

  // ─── Buscar usuario para nuevo chat ──────────────────────────

  buscarUsuarios(): void {
    if (this.buscandoUsuario.trim().length < 2) {
      this.usuarios = [];
      return;
    }
    this.buscando = true;
    this.usuarioService.getAll().subscribe({
      next: (data: any[]) => {
        const termino = this.buscandoUsuario.toLowerCase();
        this.usuarios = data.filter(u =>
          u._id !== this.usuarioActual?.id &&
          u.nombre?.toLowerCase().includes(termino)
        );
        this.buscando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.buscando = false; }
    });
  }

  iniciarChatCon(usuario: any): void {
    this.chatService.crearOObtenerConversacion(usuario._id).subscribe({
      next: (conv) => {
        const existe = this.conversaciones.find(c => c._id === conv._id);
        if (!existe) {
          this.conversaciones = [conv, ...this.conversaciones];
        }
        this.abrirConversacion(conv);
        this.buscandoUsuario = '';
        this.usuarios = [];
        this.cdr.detectChanges();
      },
      error: () => this.toastr.error('Error al iniciar conversación')
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  esMio(msg: Mensaje): boolean {
    return msg.remitente?._id === this.usuarioActual?.id;
  }

  otroParticipante(conv: Conversacion): any {
    return conv.participantes?.find(p => p._id !== this.usuarioActual?.id);
  }

  private scrollAlFinal(): void {
    try {
      const el = this.mensajesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  trackById(_: number, item: any): string {
    return item._id;
  }
}
