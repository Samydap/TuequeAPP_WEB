import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { IntercambioService } from '../../services/intercambio.service';
import { ArticuloService } from '../../services/articulo.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-intercambios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './intercambios.component.html',
})
export class IntercambiosComponent implements OnInit {
  intercambios: any[] = [];
  articulos: any[] = [];
  propuestaForm: FormGroup;
  cargando = false;
  estadosBadge: any = {
    pendiente: 'warning',
    aceptado: 'success',
    rechazado: 'danger',
    completado: 'primary',
    cancelado: 'secondary'
  };

  constructor(
    private intercambioService: IntercambioService,
    private articuloService: ArticuloService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.propuestaForm = this.fb.group({
      articuloOfrecido: ['', Validators.required],
      articuloDeseado: ['', Validators.required],
      mensaje: ['']
    });
  }

  ngOnInit() {
    this.cargarIntercambios();
    this.cargarArticulos();
  }

  cargarIntercambios() {
    this.intercambioService.getMisIntercambios().subscribe({
      next: (data) => { this.intercambios = data; this.cdr.detectChanges(); },
      error: () => this.toastr.error('Error al cargar intercambios', 'Error')
    });
  }

  cargarArticulos() {
    this.articuloService.getAll().subscribe({
      next: (data) => { this.articulos = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  get usuarioActual() {
    return this.authService.getUsuario();
  }

  esSolicitante(intercambio: any): boolean {
    return intercambio.solicitante?._id === this.usuarioActual?.id ||
           intercambio.solicitante?.id === this.usuarioActual?.id;
  }

  esReceptor(intercambio: any): boolean {
    return intercambio.receptor?._id === this.usuarioActual?.id ||
           intercambio.receptor?.id === this.usuarioActual?.id;
  }

  misArticulos() {
    return this.articulos.filter(a =>
      a.usuario?._id === this.usuarioActual?.id ||
      a.usuario?.id === this.usuarioActual?.id
    );
  }

  articulosDeOtros() {
    return this.articulos.filter(a =>
      a.usuario?._id !== this.usuarioActual?.id &&
      a.usuario?.id !== this.usuarioActual?.id
    );
  }

  enviarPropuesta() {
    if (this.propuestaForm.invalid) return;
    this.cargando = true;
    this.intercambioService.crear(this.propuestaForm.value).subscribe({
      next: () => {
        this.toastr.success('Propuesta enviada exitosamente', 'Éxito');
        this.cargarIntercambios();
        this.propuestaForm.reset();
        this.cargando = false;
      },
      error: (err) => {
        this.toastr.error(err.error?.mensaje || 'Error al enviar propuesta', 'Error');
        this.cargando = false;
      }
    });
  }

  responder(id: string, estado: string) {
    this.intercambioService.actualizarEstado(id, estado).subscribe({
      next: () => {
        this.toastr.success(`Intercambio ${estado}`, 'Actualizado');
        this.cargarIntercambios();
      },
      error: (err) => this.toastr.error(err.error?.mensaje || 'Error', 'Error')
    });
  }

  cancelar(id: string) {
    if (!confirm('¿Cancelar esta propuesta?')) return;
    this.intercambioService.cancelar(id).subscribe({
      next: () => {
        this.toastr.success('Propuesta cancelada', 'Éxito');
        this.cargarIntercambios();
      },
      error: (err) => this.toastr.error(err.error?.mensaje || 'Error', 'Error')
    });
  }
}
