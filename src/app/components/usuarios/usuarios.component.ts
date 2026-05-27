import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { ReviewService } from '../../services/review.service';

interface ImagenPreview {
  url: string;
  nombre: string;
  file?: File;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuarioForm: FormGroup;
  editando    = false;
  selectedId: string | null = null;
  cargando    = false;

  imagenesPreview: ImagenPreview[] = [];
  isDragging     = false;
  subiendo       = false;
  progresoSubida = 0;

  // Reseñas
  perfilSeleccionado: any = null;
  reviewsData: { promedio: number; total: number; reviews: any[] } | null = null;
  cargandoReviews = false;

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private reviewService: ReviewService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.usuarioForm = this.fb.group({
      nombre:    ['', Validators.required],
      telefono:  [''],
      direccion: [''],
      foto:      ['']
    });
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  // ── Drag & Drop ────────────────────────────────────────────────

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) { this.agregarArchivos(Array.from(input.files)); input.value = ''; }
  }

  onDragOver(event: DragEvent)  { event.preventDefault(); this.isDragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragging = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) { this.agregarArchivos(Array.from(event.dataTransfer.files)); }
  }

  agregarArchivos(files: File[]) {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (files.length === 0) return;
    const file = files[0];
    if (!permitidos.includes(file.type)) { this.toastr.warning(`${file.name}: formato no soportado`); return; }
    if (file.size > 5 * 1024 * 1024)    { this.toastr.warning(`${file.name}: supera los 5 MB`);      return; }
    this.limpiarImagenes();
    this.imagenesPreview.push({ url: URL.createObjectURL(file), nombre: file.name, file });
    this.cdr.detectChanges();
  }

  eliminarImagen(index: number) {
    const img = this.imagenesPreview[index];
    if (img.file) URL.revokeObjectURL(img.url);
    this.imagenesPreview.splice(index, 1);
    this.cdr.detectChanges();
  }

  // ── Subida al servidor (Multer) ────────────────────────────────

  private async procesarImagenPerfil(): Promise<string> {
    const archivoLocal = this.imagenesPreview.find(img => img.file);

    if (archivoLocal) {
      this.subiendo = true;
      this.progresoSubida = 10;
      this.cdr.detectChanges();

      try {
        const formData = new FormData();
        formData.append('imagenes', archivoLocal.file!, archivoLocal.nombre);

        const response = await fetch('/api/upload/imagenes', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.authService.getToken()}` },
          body: formData
        });

        if (!response.ok) throw new Error('upload falló');

        const data = await response.json();
        this.progresoSubida = 100;
        this.subiendo = false;
        // El endpoint ya guardó foto en la BD; devolvemos la URL pública
        return data.urls?.[0] || '';
      } catch {
        this.toastr.error('Error al subir imagen al servidor.', 'Error');
        this.subiendo = false;
        return '';
      }
    }

    // Sin archivo nuevo → usar URL manual o imagen actual
    const urlManual = this.usuarioForm.value.foto?.trim() || '';
    if (urlManual) return urlManual;

    const existente = this.imagenesPreview.find(img => !img.file);
    return existente?.url || '';
  }

  // ── CRUD ───────────────────────────────────────────────────────

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

  verPerfil(usuario: any) {
    this.perfilSeleccionado = usuario;
    this.reviewsData = null;
    this.cargandoReviews = true;
    this.reviewService.getReviewsUsuario(usuario._id).subscribe({
      next: (data) => { this.reviewsData = data; this.cargandoReviews = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoReviews = false; }
    });
  }

  cerrarPerfil() {
    this.perfilSeleccionado = null;
    this.reviewsData = null;
  }

  estrellas(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  editarPerfil() {
    const u = this.usuarios.find(x => x._id === this.usuarioActual?.id);
    if (!u) return;
    this.editando   = true;
    this.selectedId = u._id;

    this.usuarioForm.patchValue({
      nombre:    u.nombre,
      telefono:  u.telefono  || '',
      direccion: u.direccion || '',
      foto:      ''
    });

    this.limpiarImagenes();

    // Pre-cargar imagen actual de la BD (campo foto)
    if (u.foto) {
      this.imagenesPreview.push({ url: u.foto, nombre: 'Foto de perfil actual' });
    }
  }

  async guardar() {
    if (!this.selectedId || this.usuarioForm.invalid) return;
    this.cargando = true;

    // 1. Subir imagen nueva o recuperar URL existente
    const urlFinalImagen = await this.procesarImagenPerfil();

    // 2. Payload — campo foto que acepta la API
    const payload: any = {
      nombre:    this.usuarioForm.value.nombre,
      telefono:  this.usuarioForm.value.telefono,
      direccion: this.usuarioForm.value.direccion,
    };
    if (urlFinalImagen) payload.foto = urlFinalImagen;

    this.usuarioService.actualizar(this.selectedId, payload).subscribe({
      next: (res) => {
        this.toastr.success('Perfil actualizado', 'Éxito');

        const usuarioActualizado = res.usuario;

        // 3. Actualizar lista local inmediatamente
        const index = this.usuarios.findIndex(x => x._id === this.selectedId);
        if (index !== -1) {
          this.usuarios[index] = { ...this.usuarios[index], ...usuarioActualizado };
        }

        // 4. Sincronizar sesión + disparar BehaviorSubject → Navbar se actualiza sin recargar
        this.authService.actualizarSesionLocal({
          nombre:    usuarioActualizado.nombre,
          foto:      usuarioActualizado.foto || '',
          telefono:  usuarioActualizado.telefono,
          direccion: usuarioActualizado.direccion
        });

        this.cerrarModal();
        this.cargando = false;
        this.cdr.detectChanges();
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
    this.editando   = false;
    this.selectedId = null;
    this.usuarioForm.reset();
    this.limpiarImagenes();
  }

  private limpiarImagenes() {
    this.imagenesPreview.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); });
    this.imagenesPreview = [];
    this.subiendo        = false;
    this.progresoSubida  = 0;
  }
}
