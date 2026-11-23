/**
 * Servicios de consumo para Historial de Reservas del Cliente (Público).
 */

import { request } from "./client"
import type { ReservaConDetalles } from "./types"

export async function getReservasCliente(
  correo: string,
): Promise<ReservaConDetalles[]> {
  const params = new URLSearchParams({ correo: correo.trim() })
  return request<ReservaConDetalles[]>(`/reservas?${params.toString()}`)
}

export async function getReservaById(
  idReserva: number,
): Promise<ReservaConDetalles> {
  return request<ReservaConDetalles>(`/reservas/${idReserva}`)
}
