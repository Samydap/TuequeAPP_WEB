import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  cargando = true;
  error = false;

  // Colores para las barras por estado
  coloresEstado: Record<string, string> = {
    nuevo:   '#4CAF50',
    bueno:   '#7f4ca5',
    regular: '#FF9800',
    malo:    '#F44336',
  };

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        // Garantizar estructura mínima para que el template nunca reciba undefined
        this.stats = {
          totales: {
            articulos:    data?.totales?.articulos    ?? 0,
            usuarios:     data?.totales?.usuarios     ?? 0,
            intercambios: data?.totales?.intercambios ?? 0,
          },
          articulosPorEstado:    data?.articulosPorEstado    ?? [],
          articulosPorCategoria: data?.articulosPorCategoria ?? [],
          ultimosArticulos:      data?.ultimosArticulos      ?? [],
        };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  porcentajeEstado(total: number): number {
    if (!this.stats?.totales?.articulos) return 0;
    return Math.round((total / this.stats.totales.articulos) * 100);
  }

  porcentajeCategoria(total: number): number {
    const maxCat = this.stats?.articulosPorCategoria?.[0]?.total || 1;
    return Math.round((total / maxCat) * 100);
  }

  colorEstado(estado: string): string {
    return this.coloresEstado[estado] || '#9E9E9E';
  }

  badgeClass(estado: string): string {
    const map: Record<string, string> = {
      nuevo: 'success', bueno: 'primary', regular: 'warning', malo: 'danger'
    };
    return `badge bg-${map[estado] || 'secondary'}`;
  }

  trackByFn(_i: number, item: any) { return item._id; }
}
