/**
 * Servicios de consumo para Catálogo de Equipos y Categorías (Público).
 */

import { request } from "./client"
import type { Categoria, DisponibilidadResponse, Equipo } from "./types"

export async function getCategorias(): Promise<Categoria[]> {
  return request<Categoria[]>("/categorias")
}

export async function getEquipos(
  idCategoria?: number,
  search?: string,
): Promise<Equipo[]> {
  const params = new URLSearchParams()
  if (idCategoria !== undefined && idCategoria !== null) {
    params.append("id_categoria", String(idCategoria))
  }
  if (search && search.trim()) {
    params.append("search", search.trim())
  }
  const query = params.toString() ? `?${params.toString()}` : ""
  return request<Equipo[]>(`/equipos${query}`)
}

export async function getEquipoById(idEquipo: number): Promise<Equipo> {
  return request<Equipo>(`/equipos/${idEquipo}`)
}

export async function checkDisponibilidad(
  idEquipo: number,
  fechaRetiro: string,
  fechaDevolucion: string,
): Promise<DisponibilidadResponse> {
  const params = new URLSearchParams({
    fecha_retiro: fechaRetiro,
    fecha_devolucion: fechaDevolucion,
  })
  return request<DisponibilidadResponse>(
    `/equipos/${idEquipo}/disponibilidad?${params.toString()}`,
  )
}
