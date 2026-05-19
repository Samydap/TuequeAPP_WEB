import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
})
export class CategoriasComponent implements OnInit {
  categorias: any[] = [];
  categoriaForm: FormGroup;
  editando = false;
  selectedId: string | null = null;
  cargando = false;

  constructor(
    private categoriaService: CategoriaService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(100)]
    });
  }

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.categoriaService.getAll().subscribe({
      next: (data) => { this.categorias = data; this.cdr.detectChanges(); },
      error: () => this.toastr.error('Error al cargar categorías', 'Error')
    });
  }

  abrirModalNuevo() {
    this.editando = false;
    this.selectedId = null;
    this.categoriaForm.reset();
  }

  editar(cat: any) {
    this.editando = true;
    this.selectedId = cat._id;
    this.categoriaForm.patchValue({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
  }

  guardar() {
    if (this.categoriaForm.invalid) return;
    this.cargando = true;
    const op = this.editando && this.selectedId
      ? this.categoriaService.actualizar(this.selectedId, this.categoriaForm.value)
      : this.categoriaService.crear(this.categoriaForm.value);

    op.subscribe({
      next: () => {
        this.toastr.success(this.editando ? 'Categoría actualizada' : 'Categoría creada', 'Éxito');
        this.cargarCategorias();
        this.cerrarModal();
        this.cargando = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.mensaje || 'Error al guardar', 'Error');
        this.cargando = false;
      }
    });
  }

  eliminar(id: string) {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    this.categoriaService.eliminar(id).subscribe({
      next: () => {
        this.toastr.success('Categoría eliminada', 'Éxito');
        this.cargarCategorias();
      },
      error: (err) => this.toastr.error(err.error?.mensaje || 'Error al eliminar', 'Error')
    });
  }

  cerrarModal() {
    this.editando = false;
    this.selectedId = null;
    this.categoriaForm.reset();
  }
}
