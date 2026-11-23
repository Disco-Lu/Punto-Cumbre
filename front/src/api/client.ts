/**
 * Cliente HTTP base para la comunicación con la API REST de FastAPI.
 *
 * Características Green Software:
 * - Reutiliza cabeceras y decodifica JSON de forma asíncrona no bloqueante.
 * - Inyecta automáticamente el token Bearer JWT desde sessionStorage.
 * - Extrae mensajes de error estructurados del backend.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"

const TOKEN_KEY = "punto_cumbre_admin_token"

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}

export class ApiClientError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiClientError"
    this.status = status
    this.detail = detail
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = getAuthToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Manejo de respuestas sin contenido (204 No Content)
  if (response.status === 204) {
    return null as T
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorDetail =
      data?.detail ||
      (typeof data === "string" ? data : `Error HTTP ${response.status}`)
    throw new ApiClientError(response.status, errorDetail)
  }

  return data as T
}
