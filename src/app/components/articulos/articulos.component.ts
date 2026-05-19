import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ArticuloService } from '../../services/articulo.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';

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
      imagenes: ['']
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

  abrirModalNuevo() {
    this.editando = false;
    this.selectedId = null;
    this.articuloForm.reset({ estado: 'bueno' });
  }

  guardar() {
    if (this.articuloForm.invalid) return;
    this.cargando = true;
    const valor = { ...this.articuloForm.value };
    if (valor.imagenes) {
      valor.imagenes = valor.imagenes.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else {
      valor.imagenes = [];
    }

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
      imagenes: (articulo.imagenes || []).join(', ')
    });
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
  }

  badgeEstado(estado: string): string {
    const map: any = { nuevo: 'success', bueno: 'primary', regular: 'warning', malo: 'danger' };
    return map[estado] || 'secondary';
  }
}
