import { useCallback, useEffect, useState } from "react"
import logoImg from "@/imports/punto-cumbre-logo.png"
import {
  actualizarEquipo,
  actualizarEstadoReserva,
  ApiClientError,
  crearEquipo,
  eliminarEquipo,
  getAdminReservas,
  getCategorias,
  getMetricasDashboard,
  type AdminProfile,
  type Categoria,
  type EstadoReserva,
  type MetricasDashboard,
} from "@/api"
import { Icon, type IconName } from "@/components/ui/Icon"
import { Button, SectionLabel } from "@/components/ui/primitives"
import {
  currency,
  STATUS_LABELS,
  toRentalRequest,
  type RentalItem,
  type RentalRequest,
} from "@/lib/adapters"
import { ProductEditor, type ProductFormData } from "./ProductEditor"
import { RequestsTable } from "./RequestsTable"

const STATUS_FILTERS: readonly [EstadoReserva | "todas", string][] = [
  ["todas", "Todas"],
  ["pendiente", "Pendientes"],
  ["confirmada", "Confirmadas"],
  ["en_arriendo", "En arriendo"],
  ["devuelta", "Devueltas"],
  ["cancelada", "Canceladas"],
]

export default function AdminView({
  adminUser,
  products,
  onExit,
  onLogout,
  onReloadCatalog,
}: {
  adminUser: AdminProfile
  products: RentalItem[]
  onExit: () => void
  onLogout: () => void
  onReloadCatalog: () => Promise<void>
}) {
  const [section, setSection] = useState<
    "resumen" | "solicitudes" | "inventario"
  >("resumen")
  const [statusFilter, setStatusFilter] = useState<EstadoReserva | "todas">(
    "todas",
  )
  const [productEditor, setProductEditor] = useState<{
    product: RentalItem | null
  } | null>(null)

  const [metrics, setMetrics] = useState<MetricasDashboard | null>(null)
  const [requests, setRequests] = useState<RentalRequest[]>([])
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [updatingReservationId, setUpdatingReservationId] = useState<
    number | null
  >(null)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(
    null,
  )

  const handleApiError = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiClientError && err.status === 401) {
        onLogout()
        return
      }
      setPanelError(err instanceof ApiClientError ? err.detail : fallback)
    },
    [onLogout],
  )

  const refreshAdminData = useCallback(
    async (silent = false) => {
      if (silent) {
        setSyncing(true)
      } else {
        setLoading(true)
      }
      try {
        const [metricasData, reservasData, categoriasData] = await Promise.all([
          getMetricasDashboard(),
          getAdminReservas(),
          getCategorias(),
        ])
        setMetrics(metricasData)
        setRequests(reservasData.map(toRentalRequest))
        setCategories(categoriasData)
        setLastUpdated(new Date())
        setPanelError(null)
      } catch (err: unknown) {
        handleApiError(err, "No pudimos actualizar los datos del panel.")
      } finally {
        setLoading(false)
        setSyncing(false)
      }
    },
    [handleApiError],
  )

  useEffect(() => {
    void refreshAdminData(false)
  }, [refreshAdminData])

  // Sincronización en tiempo real (Green Software): solo consulta si la pestaña está visible.
  useEffect(() => {
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshAdminData(true)
        void onReloadCatalog()
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshAdminData(true)
      }
    }, 15000)

    window.addEventListener("focus", onVisibilityOrFocus)
    document.addEventListener("visibilitychange", onVisibilityOrFocus)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", onVisibilityOrFocus)
      document.removeEventListener("visibilitychange", onVisibilityOrFocus)
    }
  }, [refreshAdminData, onReloadCatalog])

  const handleStatusChange = async (
    reservationId: number,
    nuevoEstado: EstadoReserva,
  ) => {
    setUpdatingReservationId(reservationId)
    setPanelError(null)
    try {
      const updated = await actualizarEstadoReserva(reservationId, nuevoEstado)
      const mapped = toRentalRequest(updated)
      setRequests((current) =>
        current.map((item) =>
          item.reservationId === reservationId ? mapped : item,
        ),
      )
      setMetrics(await getMetricasDashboard())
      setLastUpdated(new Date())
    } catch (err: unknown) {
      handleApiError(err, "No se pudo actualizar el estado de la reserva.")
    } finally {
      setUpdatingReservationId(null)
    }
  }

  const handleSaveProduct = async (payload: ProductFormData) => {
    try {
      if (productEditor?.product) {
        await actualizarEquipo(productEditor.product.id, payload)
      } else {
        await crearEquipo({ ...payload, id_admin: adminUser.id_admin })
      }
      await Promise.all([onReloadCatalog(), refreshAdminData(true)])
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 401) {
        onLogout()
      }
      throw err
    }
  }

  const handleDeleteProduct = async (item: RentalItem) => {
    if (!window.confirm(`¿Eliminar "${item.name}" del catálogo?`)) return
    setDeletingProductId(item.id)
    setPanelError(null)
    try {
      await eliminarEquipo(item.id)
      await Promise.all([onReloadCatalog(), refreshAdminData(true)])
    } catch (err: unknown) {
      handleApiError(err, "No se pudo eliminar el equipo.")
    } finally {
      setDeletingProductId(null)
    }
  }

  const filteredRequests =
    statusFilter === "todas"
      ? requests
      : requests.filter((req) => req.status === statusFilter)

  const exportRequestsCsv = () => {
    const headers = [
      "ID",
      "Cliente",
      "Correo",
      "Teléfono",
      "Equipos",
      "Retiro",
      "Devolución",
      "Días",
      "Total Estimado",
      "Estado",
    ]
    const escapeCsv = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`
    const rows = filteredRequests.map((r) =>
      [
        r.id,
        r.customer,
        r.email,
        r.phone,
        r.item,
        r.startDate,
        r.endDate,
        r.days,
        r.total,
        STATUS_LABELS[r.status],
      ]
        .map(escapeCsv)
        .join(","),
    )
    const blob = new Blob([`\uFEFF${[headers.join(","), ...rows].join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `solicitudes-punto-cumbre-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const activeCount = metrics
    ? (metrics.resumen_reservas.por_estado.pendiente ?? 0) +
      (metrics.resumen_reservas.por_estado.confirmada ?? 0) +
      (metrics.resumen_reservas.por_estado.en_arriendo ?? 0)
    : requests.filter(
        (r) => r.status !== "devuelta" && r.status !== "cancelada",
      ).length

  const projectedRevenue = requests
    .filter((r) => r.status !== "cancelada")
    .reduce((sum, req) => sum + req.total, 0)

  const registeredRevenue = metrics?.finanzas.total_ingresos ?? 0

  return (
    <div className="min-h-screen bg-snow text-slate lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col bg-slate p-6 text-white lg:min-h-screen lg:p-8">
        <div className="w-full">
          <div className="flex items-center gap-3 border-b border-white/10 pb-7">
            <span className="grid h-14 w-14 overflow-hidden rounded-full bg-white">
              <img
                src={logoImg}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <div className="font-display text-xl font-bold uppercase tracking-wide">
                Punto Cumbre
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Panel administrativo
              </div>
            </div>
          </div>

          <nav className="mt-8 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {(
              [
                ["resumen", "dashboard", "Resumen"],
                ["solicitudes", "calendar", "Solicitudes"],
                ["inventario", "package", "Inventario"],
              ] as const
            ).map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`flex min-h-12 items-center gap-3 px-4 text-left text-sm font-semibold transition-colors ${
                  section === id
                    ? "bg-orange text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={icon} className="h-5 w-5" /> {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 space-y-2 border-t border-white/10 pt-6 lg:mt-auto">
          <button
            onClick={onExit}
            className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-semibold text-white/55 transition-colors hover:text-white"
          >
            <Icon name="arrow" className="h-5 w-5 rotate-180" /> Volver al sitio
          </button>
          <button
            onClick={onLogout}
            className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-semibold text-orange-soft/85 transition-colors hover:bg-white/5 hover:text-orange-soft"
          >
            <Icon name="logout" className="h-5 w-5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="p-5 sm:p-8 lg:p-12">
        <header className="flex flex-col justify-between gap-5 border-b border-slate/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>Operación diaria en tiempo real</SectionLabel>
            <h1 className="font-display text-5xl font-bold uppercase leading-none">
              {section === "resumen"
                ? "Resumen general"
                : section === "solicitudes"
                  ? "Solicitudes de arriendo"
                  : "Inventario"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                void refreshAdminData(true)
                void onReloadCatalog()
              }}
              disabled={syncing}
              className="border border-slate/15 bg-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate/70 transition-colors hover:border-orange hover:text-orange disabled:opacity-50"
            >
              {syncing
                ? "Sincronizando..."
                : lastUpdated
                  ? `Actualizar · ${lastUpdated.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Actualizar"}
            </button>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center bg-slate text-white">
                <Icon name="admin" />
              </span>
              <div>
                <div className="text-sm font-semibold">
                  {adminUser.username}
                </div>
                <div className="text-xs text-slate/45">
                  Sesión JWT activa · ID #{adminUser.id_admin}
                </div>
              </div>
            </div>
          </div>
        </header>

        {panelError && (
          <div
            role="alert"
            className="mt-6 flex items-center justify-between gap-4 border-l-2 border-orange bg-orange/8 px-4 py-3 text-sm text-orange-dark"
          >
            <span>{panelError}</span>
            <button
              onClick={() => setPanelError(null)}
              className="text-xs font-bold uppercase tracking-wider underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {loading && !metrics ? (
          <div className="mt-8 border border-slate/10 bg-white p-10 text-center text-sm text-slate/55">
            Cargando datos en tiempo real desde Supabase...
          </div>
        ) : (
          <>
            {section === "resumen" && (
              <>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      [
                        "Solicitudes activas",
                        String(activeCount),
                        "calendar",
                        metrics
                          ? `${metrics.resumen_reservas.por_estado.pendiente} pend. · ${metrics.resumen_reservas.por_estado.confirmada} conf. · ${metrics.resumen_reservas.por_estado.en_arriendo} en curso`
                          : "En vivo",
                      ],
                      [
                        registeredRevenue > 0
                          ? "Ingresos registrados"
                          : "Ingresos proyectados",
                        currency.format(
                          registeredRevenue > 0
                            ? registeredRevenue
                            : projectedRevenue,
                        ),
                        "cart",
                        registeredRevenue > 0
                          ? `${metrics?.finanzas.transacciones_count ?? 0} pagos · Proy. ${currency.format(projectedRevenue)}`
                          : `${metrics?.clientes.total_registrados ?? 0} clientes registrados`,
                      ],
                      [
                        "Equipos en catálogo",
                        String(
                          metrics?.catalogo.total_equipos ?? products.length,
                        ),
                        "package",
                        `${metrics?.catalogo.stock_total_unidades ?? 0} unidades · ${metrics?.catalogo.total_categorias ?? categories.length} categorías`,
                      ],
                    ] as [string, string, IconName, string][]
                  ).map(([label, value, icon, badge]) => (
                    <article
                      key={label}
                      className="border border-slate/10 bg-white p-6"
                    >
                      <div className="flex items-center justify-between text-orange">
                        <Icon name={icon} className="h-6 w-6" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate/40">
                          {badge}
                        </span>
                      </div>
                      <div className="mt-8 font-display text-4xl font-bold uppercase">
                        {value}
                      </div>
                      <div className="mt-1 text-sm text-slate/50">{label}</div>
                    </article>
                  ))}
                </div>
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold uppercase">
                      Actividad reciente
                    </h2>
                    <button
                      onClick={() => setSection("solicitudes")}
                      className="text-xs font-bold uppercase tracking-wider text-orange"
                    >
                      Ver todas ({requests.length})
                    </button>
                  </div>
                  <RequestsTable
                    requests={requests.slice(0, 5)}
                    updatingId={updatingReservationId}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </>
            )}

            {section === "solicitudes" && (
              <div className="mt-8">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setStatusFilter(value)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                          statusFilter === value
                            ? "bg-orange text-white"
                            : "border border-slate/15 bg-white text-slate/60 hover:border-orange hover:text-slate"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="dark"
                    className="min-h-10 shrink-0"
                    onClick={exportRequestsCsv}
                    disabled={filteredRequests.length === 0}
                  >
                    Exportar CSV ({filteredRequests.length})
                  </Button>
                </div>
                <RequestsTable
                  requests={filteredRequests}
                  updatingId={updatingReservationId}
                  onStatusChange={handleStatusChange}
                />
              </div>
            )}

            {section === "inventario" && (
              <div className="mt-8">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-display text-2xl font-bold uppercase">
                      Catálogo de productos
                    </h2>
                    <p className="mt-1 text-sm text-slate/50">
                      {products.length} equipos publicados en Supabase
                    </p>
                  </div>
                  <Button
                    className="shrink-0"
                    onClick={() => setProductEditor({ product: null })}
                  >
                    <Icon name="plus" /> Agregar equipo
                  </Button>
                </div>

                {products.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {products.map((item) => (
                      <article
                        key={item.id}
                        className="flex gap-5 border border-slate/10 bg-white p-5"
                      >
                        <img
                          src={item.image}
                          alt=""
                          className="h-28 w-28 shrink-0 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange">
                              {item.use}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate/45">
                              Stock: {item.stock}
                            </span>
                          </div>
                          <h3 className="mt-1 font-display text-xl font-bold uppercase leading-none">
                            {item.name}
                          </h3>
                          <div className="mt-3 text-sm font-semibold">
                            {currency.format(item.price)}{" "}
                            <span className="font-normal text-slate/40">
                              / día
                            </span>
                          </div>
                          <div className="mt-4 flex items-center gap-4 border-t border-slate/10 pt-3">
                            <button
                              onClick={() => setProductEditor({ product: item })}
                              disabled={deletingProductId === item.id}
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate/55 transition-colors hover:text-orange disabled:opacity-40"
                            >
                              <Icon name="edit" className="h-4 w-4" /> Editar
                            </button>
                            <button
                              onClick={() => void handleDeleteProduct(item)}
                              disabled={deletingProductId === item.id}
                              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate/40 transition-colors hover:text-orange-dark disabled:opacity-40"
                            >
                              <Icon name="trash" className="h-4 w-4" />{" "}
                              {deletingProductId === item.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate/20 bg-white p-12 text-center">
                    <Icon
                      name="package"
                      className="mx-auto h-10 w-10 text-slate/25"
                    />
                    <h3 className="mt-4 font-display text-2xl font-bold uppercase">
                      Inventario vacío
                    </h3>
                    <p className="mt-2 text-sm text-slate/45">
                      Agrega el primer equipo para publicarlo en el catálogo.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {productEditor && (
        <ProductEditor
          product={productEditor.product}
          categories={categories}
          onClose={() => setProductEditor(null)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  )
}
