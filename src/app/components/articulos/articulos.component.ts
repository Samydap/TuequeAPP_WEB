import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ArticuloService } from '../../services/articulo.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';

interface ImagenPreview {
  url: string;
  nombre: string;
  file?: File;
}

@Component({
  selector: 'app-articulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './articulos.component.html',
})
export class ArticulosComponent implements OnInit {
  articulos: any[] = [];
  categorias: any[] = [];
  articuloForm: FormGroup;
  editando = false;
  selectedId: string | null = null;
  cargando = false;
  estadosDisponibles = ['nuevo', 'bueno', 'regular', 'malo'];

  // Imagen upload
  imagenesPreview: ImagenPreview[] = [];
  isDragging = false;
  subiendo = false;
  progresoSubida = 0;

  constructor(
    private articuloService: ArticuloService,
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.articuloForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(100)]],
      estado: ['bueno'],
      categoria: ['', Validators.required],
      intercambioDeseado: [''],
      imagenesUrl: ['']   // campo para URLs manuales (reemplaza al anterior "imagenes")
    });
  }

  ngOnInit() {
    this.cargarArticulos();
    this.cargarCategorias();
  }

  cargarArticulos() {
    this.articuloService.getAll().subscribe({
      next: (data) => { this.articulos = data; this.cdr.detectChanges(); },
      error: () => this.toastr.error('Error al cargar artículos', 'Error')
    });
  }

  cargarCategorias() {
    this.categoriaService.getAll().subscribe({
      next: (data) => { this.categorias = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  get usuarioActual() {
    return this.authService.getUsuario();
  }

  esPropio(articulo: any): boolean {
    return articulo.usuario?._id === this.usuarioActual?.id ||
           articulo.usuario?.id === this.usuarioActual?.id;
  }

  // ─── Manejo de archivos ──────────────────────────────────────

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) { this.agregarArchivos(Array.from(input.files)); input.value = ''; }
  }

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragging = false; }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) { this.agregarArchivos(Array.from(event.dataTransfer.files)); }
  }

  agregarArchivos(files: File[]) {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    for (const file of files) {
      if (!permitidos.includes(file.type)) {
        this.toastr.warning(`${file.name}: formato no soportado`); continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.warning(`${file.name}: supera los 5 MB`); continue;
      }
      this.imagenesPreview.push({ url: URL.createObjectURL(file), nombre: file.name, file });
    }
    this.cdr.detectChanges();
  }

  eliminarImagen(index: number) {
    const img = this.imagenesPreview[index];
    if (img.file) URL.revokeObjectURL(img.url);
    this.imagenesPreview.splice(index, 1);
  }

  private async procesarImagenes(): Promise<string[]> {
    const urls: string[] = [];

    // URLs manuales
    const urlsManual: string = this.articuloForm.value.imagenesUrl || '';
    if (urlsManual) {
      urls.push(...urlsManual.split(',').map((s: string) => s.trim()).filter(Boolean));
    }

    // Imágenes existentes (edición, sin file local)
    const existentes = this.imagenesPreview.filter(img => !img.file).map(img => img.url);
    urls.push(...existentes);

    const archivosLocales = this.imagenesPreview.filter(img => img.file);
    if (archivosLocales.length === 0) return urls;

    this.subiendo = true;
    this.progresoSubida = 0;

    // Intenta subir al endpoint; si falla, convierte a base64
    try {
      const formData = new FormData();
      archivosLocales.forEach(img => formData.append('imagenes', img.file!, img.nombre));

      const response = await fetch('/api/upload/imagenes', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.authService.getToken()}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        urls.push(...(data.urls || []));
        this.progresoSubida = 100;
      } else {
        throw new Error('endpoint no disponible');
      }
    } catch {
      // Fallback base64
      for (let i = 0; i < archivosLocales.length; i++) {
        urls.push(await this.fileToBase64(archivosLocales[i].file!));
        this.progresoSubida = Math.round(((i + 1) / archivosLocales.length) * 100);
        this.cdr.detectChanges();
      }
    }

    this.subiendo = false;
    return urls;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ─── CRUD ────────────────────────────────────────────────────

  abrirModalNuevo() {
    this.editando = false;
    this.selectedId = null;
    this.articuloForm.reset({ estado: 'bueno' });
    this.limpiarImagenes();
  }

  async guardar() {
    if (this.articuloForm.invalid) return;
    this.cargando = true;
    try {
      const imagenes = await this.procesarImagenes();
      const valor = {
        titulo: this.articuloForm.value.titulo,
        descripcion: this.articuloForm.value.descripcion,
        estado: this.articuloForm.value.estado,
        categoria: this.articuloForm.value.categoria,
        intercambioDeseado: this.articuloForm.value.intercambioDeseado,
        imagenes
      };

      const op = this.editando && this.selectedId
        ? this.articuloService.actualizar(this.selectedId, valor)
        : this.articuloService.crear(valor);

      op.subscribe({
        next: () => {
          this.toastr.success(this.editando ? 'Artículo actualizado' : 'Artículo creado', 'Éxito');
          this.cargarArticulos();
          this.cerrarModal();
          this.cargando = false;
        },
        error: (err) => {
          this.toastr.error(err.error?.mensaje || 'Error al guardar', 'Error');
          this.cargando = false;
        }
      });
    } catch {
      this.toastr.error('Error al procesar imágenes', 'Error');
      this.cargando = false;
    }
  }

  editar(articulo: any) {
    this.editando = true;
    this.selectedId = articulo._id;
    this.articuloForm.patchValue({
      titulo: articulo.titulo,
      descripcion: articulo.descripcion,
      estado: articulo.estado,
      categoria: articulo.categoria?._id || articulo.categoria,
      intercambioDeseado: articulo.intercambioDeseado || '',
      imagenesUrl: ''
    });
    this.imagenesPreview = (articulo.imagenes || [])
      .filter((url: string) => url && !url.startsWith('data:'))
      .map((url: string) => ({ url, nombre: url.split('/').pop() || 'imagen' }));
  }

  eliminar(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este artículo?')) return;
    this.articuloService.eliminar(id).subscribe({
      next: () => {
        this.toastr.success('Artículo eliminado', 'Éxito');
        this.cargarArticulos();
      },
      error: (err) => this.toastr.error(err.error?.mensaje || 'Error al eliminar', 'Error')
    });
  }

  cerrarModal() {
    this.editando = false;
    this.selectedId = null;
    this.articuloForm.reset({ estado: 'bueno' });
    this.limpiarImagenes();
  }

  private limpiarImagenes() {
    this.imagenesPreview.forEach(img => { if (img.file) URL.revokeObjectURL(img.url); });
    this.imagenesPreview = [];
    this.subiendo = false;
    this.progresoSubida = 0;
  }

  badgeEstado(estado: string): string {
    const map: any = { nuevo: 'success', bueno: 'primary', regular: 'warning', malo: 'malo' };
    return map[estado] || 'secondary';
  }
}
