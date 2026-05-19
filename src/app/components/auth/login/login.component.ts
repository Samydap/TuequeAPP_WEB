import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: FormGroup;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.cargando = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.toastr.success('¡Bienvenido!', 'Sesión iniciada');
        this.router.navigate(['/articulos']);
      },
      error: (err: { error: { mensaje: any; }; }) => {
        this.toastr.error(err.error?.mensaje || 'Credenciales inválidas', 'Error');
        this.cargando = false;
      }
    });
  }
}
