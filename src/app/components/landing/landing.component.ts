import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  constructor(public authService: AuthService) {}

  get estaAutenticado(): boolean {
    return this.authService.estaAutenticado();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
