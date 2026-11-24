import { FormEvent, useEffect, useState } from "react"
import {
  ApiClientError,
  checkDisponibilidad,
  solicitarCotizacion,
  type DisponibilidadResponse,
} from "@/api"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/primitives"
import {
  calculateDays,
  currency,
  formatDate,
  toApiDateTime,
  type RentalItem,
  type RentalRequest,
} from "@/lib/adapters"

export function RentalModal({
  item,
  onClose,
}: {
  item: RentalItem
  onClose: () => void
}) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [lastRequest, setLastRequest] = useState<RentalRequest | null>(null)
  const [availability, setAvailability] =
    useState<DisponibilidadResponse | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const rentalDays = calculateDays(startDate, endDate)
  const rentalTotal = rentalDays * item.price
  const canSubmit =
    rentalDays > 0 &&
    !submitting &&
    !availabilityLoading &&
    availability?.esta_disponible === true

  // Consulta disponibilidad real en cuanto hay un rango de fechas válido.
  useEffect(() => {
    setAvailability(null)
    setAvailabilityError(null)
    if (!startDate || !endDate || endDate < startDate) return

    let cancelled = false
    setAvailabilityLoading(true)
    checkDisponibilidad(item.id, toApiDateTime(startDate), toApiDateTime(endDate))
      .then((result) => {
        if (!cancelled) setAvailability(result)
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setAvailabilityError(
            error instanceof ApiClientError
              ? error.detail
              : "No pudimos verificar la disponibilidad.",
          )
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [item.id, startDate, endDate])

  const submitRental = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    const formData = new FormData(event.currentTarget)
    setSubmitting(true)
    setSubmitError(null)
    try {
      const resumen = await solicitarCotizacion({
        nombre_cliente: String(formData.get("name")),
        correo_cliente: String(formData.get("email")),
        telefono_cliente: String(formData.get("phone")),
        fecha_retiro: toApiDateTime(startDate),
        fecha_devolucion: toApiDateTime(endDate),
        equipos_ids: [item.id],
      })
      setLastRequest({
        reservationId: resumen.id_reserva,
        id: `PC-${resumen.id_reserva}`,
        customer: resumen.cliente.nombre,
        email: resumen.cliente.correo,
        phone: resumen.cliente.telefono,
        item: resumen.arriendo.equipos.map((eq) => eq.nombre_equipo).join(", "),
        startDate,
        endDate,
        days: resumen.arriendo.total_dias,
        total: resumen.arriendo.total_estimado,
        status: "pendiente",
      })
      setSubmitted(true)
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiClientError
          ? error.detail
          : "No pudimos registrar tu solicitud. Intenta nuevamente.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/85 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div className="my-8 w-full max-w-xl bg-white shadow-2xl">
        {submitted ? (
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange/10 text-orange">
              <Icon name="check" className="h-8 w-8" />
            </div>
            <div className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange">
              Equipo reservado
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase">
              Continúa tu compra
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate/60">
              Tu solicitud quedó registrada. Usa el enlace para confirmar
              disponibilidad y coordinar el pago con nuestro equipo.
            </p>
            {lastRequest && (
              <div className="mt-6 border border-slate/10 bg-snow p-4 text-left">
                <div className="flex justify-between text-xs text-slate/50">
                  <span>
                    {lastRequest.days} días · {lastRequest.id}
                  </span>
                  <span>
                    {formatDate(lastRequest.startDate)} —{" "}
                    {formatDate(lastRequest.endDate)}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-4 border-t border-slate/10 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate/45">
                    Total estimado
                  </span>
                  <span className="font-display text-3xl font-bold">
                    {currency.format(lastRequest.total)}
                  </span>
                </div>
              </div>
            )}
            <a
              href={`https://wa.me/56961428080?text=${encodeURIComponent(
                `Hola Punto Cumbre, quiero continuar la compra de mi arriendo ${lastRequest?.id ?? ""}: ${lastRequest?.item ?? ""}, del ${lastRequest?.startDate ?? ""} al ${lastRequest?.endDate ?? ""}, total ${currency.format(lastRequest?.total ?? 0)}.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-orange bg-orange px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-orange-dark"
            >
              <Icon name="cart" /> Ir al enlace de compra
            </a>
            <button
              className="mt-4 text-xs font-bold uppercase tracking-wider text-slate/45 hover:text-slate"
              onClick={onClose}
            >
              Volver al catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-slate/10 p-6 sm:p-8">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
                  Solicitud de arriendo
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold uppercase">
                  {item.name}
                </h2>
                <p className="mt-2 text-sm text-slate/55">
                  Indícanos tus fechas para confirmar disponibilidad y ajuste.
                </p>
              </div>
              <button
                className="p-2 text-slate/45 hover:text-slate"
                onClick={onClose}
                aria-label="Cerrar solicitud de arriendo"
              >
                <Icon name="close" />
              </button>
            </div>
            <form onSubmit={submitRental} className="space-y-5 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
                  Fecha de retiro
                  <input
                    required
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-orange"
                  />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
                  Fecha de devolución
                  <input
                    required
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-orange"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
                Nombre completo
                <input
                  required
                  name="name"
                  placeholder="Tu nombre"
                  className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
                Correo electrónico
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="tu@correo.com"
                  className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
                Teléfono
                <input
                  required
                  name="phone"
                  type="tel"
                  maxLength={20}
                  placeholder="+56 9 1234 5678"
                  className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
                Modelo de bota o detalles de la expedición
                <textarea
                  rows={3}
                  placeholder="Cuéntanos sobre tus botas y la ruta planificada"
                  className="mt-2 w-full resize-none border border-slate/15 bg-snow p-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
                />
              </label>
              <div className="border border-slate/10 bg-snow p-4">
                <div className="flex items-center justify-between text-xs text-slate/50">
                  <span>
                    {rentalDays > 0
                      ? `${rentalDays} ${
                          rentalDays === 1 ? "día" : "días"
                        } de arriendo`
                      : "Selecciona tus fechas"}
                  </span>
                  <span>{currency.format(item.price)} / día</span>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-slate/10 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Total estimado
                  </span>
                  <span className="font-display text-3xl font-bold">
                    {currency.format(rentalTotal)}
                  </span>
                </div>
                {rentalDays > 0 && (
                  <div className="mt-3 border-t border-slate/10 pt-3 text-xs">
                    {availabilityLoading && (
                      <span className="text-slate/50">
                        Verificando disponibilidad...
                      </span>
                    )}
                    {!availabilityLoading && availabilityError && (
                      <span className="font-semibold text-red-600">
                        {availabilityError}
                      </span>
                    )}
                    {!availabilityLoading && availability && (
                      <span
                        className={`font-semibold ${
                          availability.esta_disponible
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                      >
                        {availability.esta_disponible
                          ? `Disponible · ${availability.cantidad_disponible} de ${availability.cantidad_total} unidades libres`
                          : "Sin stock disponible para esas fechas"}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {submitError && (
                <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting
                  ? "Enviando solicitud..."
                  : "Reservar y continuar compra"}{" "}
                <Icon name="arrow" />
              </Button>
              <p className="text-center text-[11px] text-slate/40">
                La reserva no genera un cobro automático. El pago se coordina en
                el siguiente paso.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
