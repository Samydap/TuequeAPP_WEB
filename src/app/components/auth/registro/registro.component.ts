import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
})
export class RegistroComponent {
  registroForm: FormGroup;
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      telefono: [''],
      direccion: ['']
    });
  }

  onSubmit() {
    if (this.registroForm.invalid) return;
    this.cargando = true;
    this.authService.registro(this.registroForm.value).subscribe({
      next: () => {
        this.toastr.success('¡Cuenta creada exitosamente!', 'Registro');
        this.router.navigate(['/articulos']);
      },
      error: (err) => {
        this.toastr.error(err.error?.mensaje || 'Error al registrarse', 'Error');
        this.cargando = false;
      }
    });
  }
}
