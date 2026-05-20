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

  

  cerrarModal() {
    this.editando = false;
    this.selectedId = null;
    this.categoriaForm.reset();
  }
}
