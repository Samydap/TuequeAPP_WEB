import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuarioForm: FormGroup;
  editando = false;
  selectedId: string | null = null;
  cargando = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.usuarioForm = this.fb.group({
      nombre: ['', Validators.required],
      telefono: [''],
      direccion: [''],
      foto: ['']
    });
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuarioService.getAll().subscribe({
      next: (data) => { this.usuarios = data; this.cdr.detectChanges(); },
      error: () => this.toastr.error('Error al cargar usuarios', 'Error')
    });
  }

  get usuarioActual() {
    return this.authService.getUsuario();
  }

  esPropioUsuario(usuario: any): boolean {
    return usuario._id === this.usuarioActual?.id;
  }

  editarPerfil() {
    const u = this.usuarios.find(x => x._id === this.usuarioActual?.id);
    if (!u) return;
    this.editando = true;
    this.selectedId = u._id;
    this.usuarioForm.patchValue({
      nombre: u.nombre, telefono: u.telefono || '',
      direccion: u.direccion || '', foto: u.foto || ''
    });
  }

  guardar() {
    if (!this.selectedId || this.usuarioForm.invalid) return;
    this.cargando = true;
    this.usuarioService.actualizar(this.selectedId, this.usuarioForm.value).subscribe({
      next: (res) => {
        this.toastr.success('Perfil actualizado', 'Éxito');
        // Update local storage with new name
        const actual = this.authService.getUsuario();
        localStorage.setItem('usuario', JSON.stringify({ ...actual, nombre: res.usuario?.nombre }));
        this.cargarUsuarios();
        this.cerrarModal();
        this.cargando = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.mensaje || 'Error al actualizar', 'Error');
        this.cargando = false;
      }
    });
  }

  eliminarCuenta(id: string) {
    if (!confirm('¿Seguro que deseas desactivar esta cuenta?')) return;
    this.usuarioService.eliminar(id).subscribe({
      next: () => {
        this.toastr.success('Cuenta desactivada', 'Éxito');
        this.authService.logout();
        window.location.href = '/login';
      },
      error: (err) => this.toastr.error(err.error?.mensaje || 'Error', 'Error')
    });
  }

  cerrarModal() {
    this.editando = false;
    this.selectedId = null;
    this.usuarioForm.reset();
  }
}
