import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'articulos', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'registro', loadComponent: () => import('./components/auth/registro/registro.component').then(m => m.RegistroComponent) },
  { path: 'articulos', loadComponent: () => import('./components/articulos/articulos.component').then(m => m.ArticulosComponent), canActivate: [authGuard] },
  { path: 'categorias', loadComponent: () => import('./components/categorias/categorias.component').then(m => m.CategoriasComponent), canActivate: [authGuard] },
  { path: 'intercambios', loadComponent: () => import('./components/intercambios/intercambios.component').then(m => m.IntercambiosComponent), canActivate: [authGuard] },
  { path: 'usuarios', loadComponent: () => import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'articulos' }
];
