/**
 * Tipos de datos TypeScript sincronizados con los esquemas Pydantic del Backend FastAPI.
 */

export interface Categoria {
  id_categoria: number
  nombre_categoria: string
  descripcion: string | null
  id_admin: number
}

export interface CategoriaCreate {
  nombre_categoria: string
  descripcion?: string | null
  id_admin: number
}

export interface Equipo {
  id_equipo: number
  id_categoria: number
  nombre_equipo: string
  caracteristicas: string
  precio_arriendo: number
  cantidad: number
  id_admin: number
  categoria?: Categoria | null
}

export interface EquipoCreate {
  id_categoria: number
  nombre_equipo: string
  caracteristicas: string
  precio_arriendo: number
  cantidad: number
  id_admin: number
}

export interface EquipoUpdate {
  id_categoria?: number
  nombre_equipo?: string
  caracteristicas?: string
  precio_arriendo?: number
  cantidad?: number
}

export interface DisponibilidadResponse {
  id_equipo: number
  cantidad_total: number
  cantidad_reservada: number
  cantidad_disponible: number
  esta_disponible: boolean
}

export interface Cliente {
  id_cliente: number
  nombre: string
  correo: string
  telefono: string
  fecha_registro: string
}

export type EstadoReserva =
  | "pendiente"
  | "confirmada"
  | "en_arriendo"
  | "devuelta"
  | "cancelada"

export interface DetalleReserva {
  id_detalle: number
  id_reserva: number
  id_equipo: number
  equipo?: Equipo | null
}

export interface ReservaConDetalles {
  id_reserva: number
  id_cliente: number
  fecha_retiro: string
  fecha_devolucion: string
  estado_reserva: EstadoReserva
  cliente?: Cliente | null
  detalles: DetalleReserva[]
}

export interface SolicitudCotizacionRequest {
  nombre_cliente: string
  correo_cliente: string
  telefono_cliente: string
  fecha_retiro: string
  fecha_devolucion: string
  equipos_ids: number[]
}

export interface EquipoCotizadoItem {
  id_equipo: number
  nombre_equipo: string
  precio_arriendo_dia: number
}

export interface ResumenCotizacionResponse {
  id_cotizacion: number
  id_reserva: number
  estado_cotizacion: string
  fecha_solicitud: string
  cliente: {
    id_cliente: number
    nombre: string
    correo: string
    telefono: string
  }
  arriendo: {
    fecha_retiro: string
    fecha_devolucion: string
    total_dias: number
    equipos: EquipoCotizadoItem[]
    total_estimado: number
  }
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export interface AdminLoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface AdminProfile {
  id_admin: number
  username: string
}

export interface MetricasDashboard {
  resumen_reservas: {
    total: number
    por_estado: Record<EstadoReserva, number>
  }
  finanzas: {
    total_ingresos: number
    transacciones_count: number
  }
  catalogo: {
    total_equipos: number
    stock_total_unidades: number
    total_categorias: number
  }
  clientes: {
    total_registrados: number
  }
  ultimas_reservas: Array<{
    id_reserva: number
    cliente_nombre: string
    cliente_correo: string
    fecha_retiro: string
    fecha_devolucion: string
    estado_reserva: EstadoReserva
  }>
}

export interface ApiError {
  detail: string
}
