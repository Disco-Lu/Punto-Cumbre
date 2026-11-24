import type { EstadoReserva } from "@/api"
import { StatusBadge } from "@/components/ui/primitives"
import {
  currency,
  formatDate,
  STATUS_LABELS,
  type RentalRequest,
} from "@/lib/adapters"

const NEXT_STATUS: Partial<Record<EstadoReserva, EstadoReserva>> = {
  pendiente: "confirmada",
  confirmada: "en_arriendo",
  en_arriendo: "devuelta",
}

export function RequestsTable({
  requests,
  updatingId,
  onStatusChange,
}: {
  requests: RentalRequest[]
  updatingId: number | null
  onStatusChange: (reservationId: number, status: EstadoReserva) => void
}) {
  if (requests.length === 0) {
    return (
      <div className="border border-dashed border-slate/20 bg-white p-10 text-center text-sm text-slate/50">
        No hay solicitudes registradas para este filtro.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-slate/10 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead className="bg-slate text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
          <tr>
            <th className="p-4">Solicitud</th>
            <th className="p-4">Cliente y equipo</th>
            <th className="p-4">Fechas</th>
            <th className="p-4">Total</th>
            <th className="p-4">Estado</th>
            <th className="p-4 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const next = NEXT_STATUS[request.status]
            const isUpdating = updatingId === request.reservationId
            return (
              <tr
                key={request.id}
                className="border-b border-slate/8 last:border-b-0"
              >
                <td className="p-4 text-xs font-bold text-orange">
                  {request.id}
                </td>
                <td className="p-4">
                  <div className="text-sm font-semibold">
                    {request.customer}
                  </div>
                  <div className="mt-0.5 text-xs text-slate/45">
                    {request.item}
                  </div>
                  {request.email && (
                    <div className="mt-0.5 text-[11px] text-slate/35">
                      {request.email}
                      {request.phone ? ` · ${request.phone}` : ""}
                    </div>
                  )}
                </td>
                <td className="p-4 text-xs text-slate/55">
                  <div>
                    {formatDate(request.startDate)} —{" "}
                    {formatDate(request.endDate)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate/35">
                    {request.days} {request.days === 1 ? "día" : "días"}
                  </div>
                </td>
                <td className="p-4 text-sm font-semibold">
                  {currency.format(request.total)}
                </td>
                <td className="p-4">
                  <StatusBadge status={request.status} />
                </td>
                <td className="p-4 text-right">
                  {next ? (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        disabled={isUpdating}
                        onClick={() =>
                          onStatusChange(request.reservationId, next)
                        }
                        className="text-xs font-bold uppercase tracking-wider text-slate transition-colors hover:text-orange disabled:opacity-40"
                      >
                        {isUpdating
                          ? "Actualizando..."
                          : `Pasar a ${STATUS_LABELS[next]}`}
                      </button>
                      <button
                        disabled={isUpdating}
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Cancelar la solicitud ${request.id} de ${request.customer}?`,
                            )
                          ) {
                            onStatusChange(request.reservationId, "cancelada")
                          }
                        }}
                        className="text-xs font-bold uppercase tracking-wider text-slate/35 transition-colors hover:text-red-600 disabled:opacity-40"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate/35">
                      {STATUS_LABELS[request.status]}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
