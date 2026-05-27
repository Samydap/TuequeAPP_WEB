import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './review.component.html',
})
export class ReviewComponent implements OnInit {
  @Input() tradeId!: string;

  reviewForm: FormGroup;
  estrellas = [1, 2, 3, 4, 5];
  ratingSeleccionado = 0;
  ratingHover = 0;
  enviando = false;
  yaResenado = false;
  puedeResenar = false;
  enviado = false;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    if (this.tradeId) {
      this.reviewService.getPendiente(this.tradeId).subscribe({
        next: (res) => {
          this.puedeResenar = res.puedeResenar;
          this.yaResenado   = res.yaResenado;
          this.cdr.detectChanges();
        }
      });
    }
  }

  seleccionarEstrella(n: number) { this.ratingSeleccionado = n; }
  hoverEstrella(n: number)       { this.ratingHover = n; }
  salirHover()                   { this.ratingHover = 0; }
  estrellaActiva(n: number)      { return n <= (this.ratingHover || this.ratingSeleccionado); }

  enviar() {
    if (!this.ratingSeleccionado) {
      this.toastr.warning('Selecciona una calificación de 1 a 5 estrellas.', 'Falta calificación');
      return;
    }
    this.enviando = true;
    this.reviewService.crearReview({
      tradeId: this.tradeId,
      rating:  this.ratingSeleccionado,
      comment: this.reviewForm.value.comment || undefined
    }).subscribe({
      next: () => {
        this.toastr.success('¡Reseña enviada!', 'Éxito');
        this.enviado    = true;
        this.yaResenado = true;
        this.enviando   = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastr.error(err.error?.mensaje || 'Error al enviar reseña.', 'Error');
        this.enviando = false;
      }
    });
  }
}
