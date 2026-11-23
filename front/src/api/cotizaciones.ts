/**
 * Servicios de consumo para Solicitudes de Cotización (Público).
 */

import { request } from "./client"
import type { ResumenCotizacionResponse, SolicitudCotizacionRequest } from "./types"

export async function solicitarCotizacion(
  datos: SolicitudCotizacionRequest,
): Promise<ResumenCotizacionResponse> {
  return request<ResumenCotizacionResponse>("/cotizaciones", {
    method: "POST",
    body: JSON.stringify(datos),
  })
}

export async function getCotizacionById(
  idCotizacion: number,
): Promise<ResumenCotizacionResponse> {
  return request<ResumenCotizacionResponse>(`/cotizaciones/${idCotizacion}`)
}
