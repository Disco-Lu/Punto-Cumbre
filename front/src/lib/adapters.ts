import type { Equipo, EstadoReserva, ReservaConDetalles } from "@/api"

export type RentalItem = {
  id: number
  categoryId: number
  stock: number
  name: string
  use: string
  detail: string
  image: string
  tag: string
  price: number
}

export type RentalRequest = {
  reservationId: number
  id: string
  customer: string
  email: string
  phone: string
  item: string
  startDate: string
  endDate: string
  days: number
  total: number
  status: EstadoReserva
}

export const STATUS_LABELS: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_arriendo: "En arriendo",
  devuelta: "Devuelta",
  cancelada: "Cancelada",
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1485871800663-71856dc09ec4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1579769696606-3a52f6d41b95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1572037861810-0e1980e7f9fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1485872987516-ec9b00fe7a65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
]

export const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(
    new Date(date.includes("T") ? date : `${date}T12:00:00`),
  )

export const toDateOnly = (isoOrDate: string) => isoOrDate.split("T")[0]

export const toApiDateTime = (date: string) => `${date}T12:00:00Z`

/** Misma regla de cálculo que el backend: días = max(1, devolución - retiro). */
export const calculateDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate || endDate < startDate) return 0
  return Math.max(
    1,
    Math.round(
      (new Date(`${endDate}T12:00:00`).getTime() -
        new Date(`${startDate}T12:00:00`).getTime()) /
        86400000,
    ),
  )
}

export const toRentalItem = (equipo: Equipo): RentalItem => ({
  id: equipo.id_equipo,
  categoryId: equipo.id_categoria,
  stock: equipo.cantidad,
  name: equipo.nombre_equipo,
  use: equipo.categoria?.nombre_categoria ?? "Equipamiento",
  detail: equipo.caracteristicas,
  tag: `${equipo.cantidad} ${equipo.cantidad === 1 ? "unidad" : "unidades"}`,
  price: Number(equipo.precio_arriendo),
  image: FALLBACK_IMAGES[equipo.id_equipo % FALLBACK_IMAGES.length],
})

export const toRentalRequest = (reserva: ReservaConDetalles): RentalRequest => {
  const startDate = toDateOnly(reserva.fecha_retiro)
  const endDate = toDateOnly(reserva.fecha_devolucion)
  const days = calculateDays(startDate, endDate) || 1
  const items = reserva.detalles
    .map((detalle) => detalle.equipo?.nombre_equipo)
    .filter((name): name is string => Boolean(name))
  const dailySum = reserva.detalles.reduce(
    (sum, detalle) => sum + Number(detalle.equipo?.precio_arriendo ?? 0),
    0,
  )

  return {
    reservationId: reserva.id_reserva,
    id: `PC-${reserva.id_reserva}`,
    customer: reserva.cliente?.nombre ?? `Cliente #${reserva.id_cliente}`,
    email: reserva.cliente?.correo ?? "",
    phone: reserva.cliente?.telefono ?? "",
    item: items.length > 0 ? items.join(", ") : "Sin equipos registrados",
    startDate,
    endDate,
    days,
    total: Math.round(dailySum * days),
    status: reserva.estado_reserva,
  }
}
