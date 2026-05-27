import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'TruequeApp';
  mostrarNavbar = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        // Ocultar navbar lateral en la landing page
        this.mostrarNavbar = e.urlAfterRedirects !== '/';
      });
  }
}
