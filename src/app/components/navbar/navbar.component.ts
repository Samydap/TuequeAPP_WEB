import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  mensajesNoLeidos = 0;

  private subs = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      this.conectarChat();
      this.iniciarPollingNoLeidos();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private conectarChat(): void {
    this.chatService.conectar();

    // Actualizar badge cuando llega notificación en tiempo real
    this.subs.add(
      this.chatService.onNotificacionMensaje().subscribe(() => {
        this.mensajesNoLeidos++;
      })
    );
  }

  private iniciarPollingNoLeidos(): void {
    // Cargar al inicio y cada 30 segundos
    this.cargarNoLeidos();
    this.subs.add(
      interval(30_000).pipe(
        switchMap(() => this.chatService.getNoLeidos())
      ).subscribe(data => {
        this.mensajesNoLeidos = data.noLeidos;
      })
    );
  }

  private cargarNoLeidos(): void {
    this.chatService.getNoLeidos().subscribe({
      next: (data) => { this.mensajesNoLeidos = data.noLeidos; },
      error: () => {}
    });
  }

  get usuario() {
    return this.authService.getUsuario();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
  }

  logout() {
    this.chatService.desconectar();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
