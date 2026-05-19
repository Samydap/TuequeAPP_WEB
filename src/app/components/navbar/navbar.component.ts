import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  sidebarCollapsed = false;

  constructor(public authService: AuthService, private router: Router) {}

  get usuario() {
    return this.authService.getUsuario();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
