/**
 * Servicios de consumo para el Panel Administrativo (Protegido con JWT).
 */

import { request, setAuthToken } from "./client"
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminProfile,
  Categoria,
  CategoriaCreate,
  Equipo,
  EquipoCreate,
  EquipoUpdate,
  EstadoReserva,
  MetricasDashboard,
  ReservaConDetalles,
} from "./types"

// ── Autenticación ─────────────────────────────────────────────────────────────

export async function loginAdmin(
  credentials: AdminLoginRequest,
): Promise<AdminLoginResponse> {
  const data = await request<AdminLoginResponse>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })
  if (data?.access_token) {
    setAuthToken(data.access_token)
  }
  return data
}

export function logoutAdmin(): void {
  setAuthToken(null)
}

export async function getAdminProfile(): Promise<AdminProfile> {
  return request<AdminProfile>("/admin/auth/me")
}

// ── Reservas ─────────────────────────────────────────────────────────────────

export async function getAdminReservas(
  estado?: string,
): Promise<ReservaConDetalles[]> {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : ""
  return request<ReservaConDetalles[]>(`/admin/reservas${query}`)
}

export async function actualizarEstadoReserva(
  idReserva: number,
  nuevoEstado: EstadoReserva,
): Promise<ReservaConDetalles> {
  return request<ReservaConDetalles>(`/admin/reservas/${idReserva}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado_reserva: nuevoEstado }),
  })
}

// ── Equipos (Inventario) ─────────────────────────────────────────────────────

export async function crearEquipo(datos: EquipoCreate): Promise<Equipo> {
  return request<Equipo>("/admin/equipos", {
    method: "POST",
    body: JSON.stringify(datos),
  })
}

export async function actualizarEquipo(
  idEquipo: number,
  datos: EquipoUpdate,
): Promise<Equipo> {
  return request<Equipo>(`/admin/equipos/${idEquipo}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  })
}

export async function eliminarEquipo(
  idEquipo: number,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/admin/equipos/${idEquipo}`, {
    method: "DELETE",
  })
}

// ── Categorías ───────────────────────────────────────────────────────────────

export async function crearCategoria(datos: CategoriaCreate): Promise<Categoria> {
  return request<Categoria>("/admin/categorias", {
    method: "POST",
    body: JSON.stringify(datos),
  })
}

export async function eliminarCategoria(
  idCategoria: number,
): Promise<{ message: string }> {
  return request<{ message: string }>(`/admin/categorias/${idCategoria}`, {
    method: "DELETE",
  })
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getMetricasDashboard(): Promise<MetricasDashboard> {
  return request<MetricasDashboard>("/admin/dashboard/metricas")
}
