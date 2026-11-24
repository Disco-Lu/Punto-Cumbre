import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react"
import logoImg from "@/imports/punto-cumbre-logo.png"
import {
  actualizarEquipo,
  actualizarEstadoReserva,
  ApiClientError,
  checkDisponibilidad,
  crearEquipo,
  eliminarEquipo,
  getAdminProfile,
  getAdminReservas,
  getCategorias,
  getEquipos,
  getMetricasDashboard,
  isAuthenticated,
  loginAdmin,
  logoutAdmin,
  solicitarCotizacion,
  type AdminProfile,
  type Categoria,
  type DisponibilidadResponse,
  type Equipo,
  type EstadoReserva,
  type MetricasDashboard,
  type ReservaConDetalles,
} from "@/api"

type IconName = "arrow" | "admin" | "backpack" | "calendar" | "cart" | "check" | "close" | "crampon" | "dashboard" | "edit" | "jacket" | "lock" | "logout" | "mail" | "map" | "menu" | "mountain" | "package" | "phone" | "plus" | "shield" | "tent" | "tool" | "trash"

type RentalItem = {
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

type RentalRequest = {
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

// Etiquetas amigables para la máquina de estados del backend.
const STATUS_LABELS: Record<EstadoReserva, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_arriendo: "En arriendo",
  devuelta: "Devuelta",
  cancelada: "Cancelada",
}

// Imágenes de referencia: la tabla `equipo` del modelo ER no tiene columna de imagen,
// por lo que se asigna una foto de forma determinística según el id del equipo.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1485871800663-71856dc09ec4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1579769696606-3a52f6d41b95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1572037861810-0e1980e7f9fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1485872987516-ec9b00fe7a65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
]

// Adaptador: convierte un `Equipo` de la API al formato visual que usa la UI.
const toRentalItem = (equipo: Equipo): RentalItem => ({
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

const toDateOnly = (isoOrDate: string) => isoOrDate.split("T")[0]

// Adaptador: convierte una `ReservaConDetalles` de la API a una fila de la tabla administrativa.
const toRentalRequest = (reserva: ReservaConDetalles): RentalRequest => {
  const startDate = toDateOnly(reserva.fecha_retiro)
  const endDate = toDateOnly(reserva.fecha_devolucion)
  const days = Math.max(
    1,
    Math.round(
      (new Date(`${endDate}T12:00:00`).getTime() -
        new Date(`${startDate}T12:00:00`).getTime()) /
        86400000,
    ),
  )
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

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(
    new Date(date.includes("T") ? date : `${date}T12:00:00`),
  )

const SERVICES: {
  icon: IconName
  title: string
  detail: string
  work: string
}[] = [
    {
      icon: "backpack",
      title: "Mochilas",
      detail:
        "Restauramos las piezas que mantienen tu carga segura, equilibrada y lista para largas aproximaciones.",
      work: "Cierres · correas · hebillas · costuras",
    },
    {
      icon: "tent",
      title: "Carpas",
      detail:
        "Reparaciones estructurales y de impermeabilización para mantener tu refugio confiable en la montaña.",
      work: "Varillas · tela · pisos · impermeabilización",
    },
    {
      icon: "jacket",
      title: "Ropa técnica",
      detail:
        "Reparaciones especializadas que conservan la movilidad y protección sin comprometer el rendimiento.",
      work: "Chaquetas · aislación · cierres · parches",
    },
  ]

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName
  className?: string
}) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M4 12h15M14 6l6 6-6 6" />
      </>
    ),
    admin: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    backpack: (
      <>
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
        <path d="M6 8h12a2 2 0 0 1 2 2v11H4V10a2 2 0 0 1 2-2Z" />
        <path d="M8 13h8M7 21v-4h10v4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.5 11h10l2-7H7" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    crampon: (
      <>
        <path d="M3 9h18M5 9l2 7h10l2-7M8 9V5M16 9V5M7 16l-2 4M12 16v5M17 16l2 4" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </>
    ),
    edit: (
      <>
        <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />
        <path d="m14 7 3 3" />
      </>
    ),
    jacket: (
      <>
        <path d="m9 4-5 4 2 5 2-2v10h8V11l2 2 2-5-5-4a3 3 0 0 1-6 0Z" />
        <path d="M12 7v14" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    mountain: (
      <>
        <path d="m2 20 7-12 3 5 2-3 8 10H2Z" />
        <path d="m7 11 2 2 2-2" />
      </>
    ),
    package: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
        <path d="M12 11v10" />
      </>
    ),
    phone: (
      <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-4-2-2 2c-3.5-1.4-6.3-4.2-8-8l2-2-2-4Z" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    shield: (
      <>
        <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    tent: (
      <>
        <path d="m3 20 9-16 9 16H3Z" />
        <path d="m12 4 4 16M8 20l4-7 4 7" />
      </>
    ),
    tool: (
      <path d="M14 6a4 4 0 0 0-5-3l3 3-3 3-3-3a4 4 0 0 0 5 5l8 8 2-2-8-8a4 4 0 0 0 1-3Z" />
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
      </>
    ),
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "light" | "outline"
}) {
  const variants = {
    primary:
      "border-orange bg-orange text-white hover:border-orange-dark hover:bg-orange-dark",
    dark: "border-slate bg-slate text-white hover:border-slate-light hover:bg-slate-light",
    light: "border-white bg-white text-slate hover:bg-snow",
    outline:
      "border-slate/20 bg-transparent text-slate hover:border-orange hover:text-orange",
  }

  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 border px-6 text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function SectionLabel({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <div
      className={`mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] ${
        light ? "text-orange-soft" : "text-orange"
      }`}
    >
      <span className="h-px w-9 bg-current" />
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: EstadoReserva }) {
  const styles: Record<EstadoReserva, string> = {
    pendiente: "bg-orange/12 text-orange-dark",
    confirmada: "bg-slate/10 text-slate",
    en_arriendo: "bg-secondary/15 text-secondary",
    devuelta: "bg-green-100 text-green-800",
    cancelada: "bg-red-100 text-red-700",
  }

  return (
    <span
      className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function AdminLogin({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (profile: AdminProfile) => void
}) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get("username")).trim()
    const password = String(formData.get("password"))

    if (!username || !password) {
      setError("Ingresa tu usuario y contraseña.")
      return
    }

    setError("")
    setLoading(true)
    try {
      await loginAdmin({ username, password })
      const profile = await getAdminProfile()
      onSuccess(profile)
    } catch (err: unknown) {
      logoutAdmin()
      setError(
        err instanceof ApiClientError
          ? err.detail
          : "No pudimos conectar con el servidor de autenticación.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/90 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !loading) onClose()
      }}
    >
      <div className="my-8 w-full max-w-md bg-white shadow-2xl">
        <div className="relative bg-slate px-7 py-8 text-white">
          <button
            className="absolute right-4 top-4 p-2 text-white/45 transition-colors hover:text-white"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar acceso administrativo"
          >
            <Icon name="close" />
          </button>
          <span className="grid h-12 w-12 place-items-center border border-orange/60 text-orange-soft">
            <Icon name="lock" className="h-6 w-6" />
          </span>
          <div className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-orange-soft">
            Acceso restringido
          </div>
          <h2 className="mt-2 font-display text-4xl font-bold uppercase leading-none">
            Panel administrativo
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Ingresa tus credenciales para gestionar arriendos e inventario.
          </p>
        </div>

        <form onSubmit={submitLogin} className="space-y-5 p-7">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
            Usuario
            <input
              required
              autoFocus
              name="username"
              type="text"
              autoComplete="username"
              placeholder="admin"
              disabled={loading}
              onChange={() => setError("")}
              className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange disabled:opacity-60"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
            Contraseña
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              disabled={loading}
              onChange={() => setError("")}
              className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange disabled:opacity-60"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="border-l-2 border-orange bg-orange/8 px-4 py-3 text-sm text-orange-dark"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verificando credenciales..." : "Ingresar al panel"}{" "}
            <Icon name="arrow" />
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-slate/40">
            Acceso exclusivo para el equipo de Punto Cumbre Outdoor.
          </p>
        </form>
      </div>
    </div>
  )
}

type ProductFormData = {
  id_categoria: number
  nombre_equipo: string
  caracteristicas: string
  precio_arriendo: number
  cantidad: number
}

function ProductEditor({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: RentalItem | null
  categories: Categoria[]
  onClose: () => void
  onSave: (payload: ProductFormData) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const formData = new FormData(event.currentTarget)
    const id_categoria = Number(formData.get("categoryId"))
    const nombre_equipo = String(formData.get("name")).trim()
    const caracteristicas = String(formData.get("detail")).trim()
    const precio_arriendo = Number(formData.get("price"))
    const cantidad = Number(formData.get("stock"))

    if (!id_categoria) {
      setError("Debes seleccionar una categoría válida.")
      return
    }

    setError("")
    setSaving(true)
    try {
      await onSave({
        id_categoria,
        nombre_equipo,
        caracteristicas,
        precio_arriendo,
        cantidad,
      })
      onClose()
    } catch (err: unknown) {
      setError(
        err instanceof ApiClientError
          ? err.detail
          : "No pudimos guardar los cambios en el servidor.",
      )
    } finally {
      setSaving(false)
    }
  }

  const fieldClass =
    "mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange disabled:opacity-60"

  const defaultCategoryId =
    product?.categoryId ?? categories[0]?.id_categoria ?? ""

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/90 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !saving) onClose()
      }}
    >
      <div className="my-8 w-full max-w-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate/10 p-6 sm:p-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
              Gestión de inventario
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase">
              {product ? "Editar equipo" : "Nuevo equipo"}
            </h2>
            <p className="mt-2 text-sm text-slate/50">
              Los cambios se guardarán en Supabase y se reflejarán en el catálogo público.
            </p>
          </div>
          <button
            className="p-2 text-slate/45 transition-colors hover:text-slate"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar editor de equipo"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={submitProduct} className="space-y-5 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Nombre del equipo
              <input
                required
                autoFocus
                name="name"
                maxLength={200}
                disabled={saving}
                defaultValue={product?.name}
                placeholder="Ej. Crampón Petzl Lynx"
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Categoría
              <select
                required
                name="categoryId"
                disabled={saving || categories.length === 0}
                defaultValue={defaultCategoryId}
                className={fieldClass}
              >
                {categories.length === 0 && (
                  <option value="">Sin categorías disponibles</option>
                )}
                {categories.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre_categoria}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Precio diario (CLP)
              <input
                required
                min="1"
                step="1"
                name="price"
                type="number"
                disabled={saving}
                defaultValue={product?.price}
                placeholder="12000"
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Stock (unidades)
              <input
                required
                min="0"
                step="1"
                name="stock"
                type="number"
                disabled={saving}
                defaultValue={product?.stock ?? 1}
                placeholder="5"
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
            Características / Ficha técnica
            <textarea
              required
              rows={4}
              name="detail"
              disabled={saving}
              defaultValue={product?.detail}
              placeholder="Describe especificaciones técnicas, material, peso y compatibilidad del equipo"
              className="mt-2 w-full resize-none border border-slate/15 bg-snow p-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange disabled:opacity-60"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="border-l-2 border-orange bg-orange/8 px-4 py-3 text-sm text-orange-dark"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || categories.length === 0}
              className="disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : product
                  ? "Guardar cambios"
                  : "Agregar equipo"}{" "}
              <Icon name={product ? "check" : "plus"} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminView({
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
  const [section, setSection] =
    useState<"resumen" | "solicitudes" | "inventario">("resumen")
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

  // Carga/revalidación en paralelo de métricas, reservas, categorías y catálogo.
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

  // Carga inicial al abrir el panel.
  useEffect(() => {
    void refreshAdminData(false)
  }, [refreshAdminData])

  // Sincronización en tiempo real (Green Software):
  // - Revalida al recuperar foco de pestaña.
  // - Intervalo liviano de 15s SOLO si la pestaña está visible (0 consumo en segundo plano).
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
      // Refresca métricas del dashboard tras el cambio de estado
      const freshMetrics = await getMetricasDashboard()
      setMetrics(freshMetrics)
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
        await crearEquipo({
          ...payload,
          id_admin: adminUser.id_admin,
        })
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
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
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
            {[
              ["resumen", "dashboard", "Resumen"],
              ["solicitudes", "calendar", "Solicitudes"],
              ["inventario", "package", "Inventario"],
            ].map(([id, icon, label]) => (
              <button
                key={id}
                onClick={() => setSection(id as typeof section)}
                className={`flex min-h-12 items-center gap-3 px-4 text-left text-sm font-semibold transition-colors ${
                  section === id
                    ? "bg-orange text-white"
                    : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon name={icon as IconName} className="h-5 w-5" /> {label}
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
                  {[
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
                      String(metrics?.catalogo.total_equipos ?? products.length),
                      "package",
                      `${metrics?.catalogo.stock_total_unidades ?? 0} unidades · ${metrics?.catalogo.total_categorias ?? categories.length} categorías`,
                    ],
                  ].map(([label, value, icon, badge]) => (
                    <article
                      key={label}
                      className="border border-slate/10 bg-white p-6"
                    >
                      <div className="flex items-center justify-between text-orange">
                        <Icon name={icon as IconName} className="h-6 w-6" />
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
                    {(
                      [
                        ["todas", "Todas"],
                        ["pendiente", "Pendientes"],
                        ["confirmada", "Confirmadas"],
                        ["en_arriendo", "En arriendo"],
                        ["devuelta", "Devueltas"],
                        ["cancelada", "Canceladas"],
                      ] as const
                    ).map(([value, label]) => (
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

function RequestsTable({
  requests,
  updatingId,
  onStatusChange,
}: {
  requests: RentalRequest[]
  updatingId: number | null
  onStatusChange: (reservationId: number, status: EstadoReserva) => void
}) {
  const nextStatus: Partial<Record<EstadoReserva, EstadoReserva>> = {
    pendiente: "confirmada",
    confirmada: "en_arriendo",
    en_arriendo: "devuelta",
  }

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
            const next = nextStatus[request.status]
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

export default function App() {
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [rentalItem, setRentalItem] = useState<RentalItem | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [lastRequest, setLastRequest] = useState<RentalRequest | null>(null)
  const [products, setProducts] = useState<RentalItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [availability, setAvailability] =
    useState<DisponibilidadResponse | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Las fechas se envían a mediodía UTC para evitar desfases de día por zona horaria.
  const toApiDateTime = (date: string) => `${date}T12:00:00Z`

  // Carga/recarga reutilizable del catálogo real desde la API (GET /equipos).
  const reloadCatalog = useCallback(async (showSpinner = false) => {
    if (showSpinner) setCatalogLoading(true)
    setCatalogError(null)
    try {
      const equipos = await getEquipos()
      setProducts(equipos.map(toRentalItem))
    } catch (error: unknown) {
      setCatalogError(
        error instanceof ApiClientError
          ? error.detail
          : "No pudimos conectar con el servidor.",
      )
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  // Restaura y valida sesión administrativa JWT persistida en sessionStorage (GET /admin/auth/me).
  useEffect(() => {
    if (!isAuthenticated()) return
    let cancelled = false
    getAdminProfile()
      .then((profile) => {
        if (!cancelled) setAdminUser(profile)
      })
      .catch(() => {
        if (!cancelled) {
          logoutAdmin()
          setAdminUser(null)
          setAdminOpen(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleOpenAdmin = () => {
    setMenuOpen(false)
    if (adminUser && isAuthenticated()) {
      setAdminOpen(true)
    } else {
      setAdminLoginOpen(true)
    }
  }

  const handleAdminLogout = () => {
    logoutAdmin()
    setAdminUser(null)
    setAdminOpen(false)
  }

  // Carga inicial del catálogo real.
  useEffect(() => {
    void reloadCatalog(true)
  }, [reloadCatalog])

  // Consulta de disponibilidad real: solo se dispara cuando ambas fechas son válidas.
  useEffect(() => {
    setAvailability(null)
    setAvailabilityError(null)
    if (!rentalItem?.id || !startDate || !endDate || endDate < startDate) return

    let cancelled = false
    setAvailabilityLoading(true)
    checkDisponibilidad(
      rentalItem.id,
      toApiDateTime(startDate),
      toApiDateTime(endDate),
    )
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
  }, [rentalItem, startDate, endDate])

  // Misma regla que el backend: días = max(1, devolución - retiro).
  const rentalDays =
    startDate && endDate && endDate >= startDate
      ? Math.max(
          1,
          Math.round(
            (new Date(`${endDate}T12:00:00`).getTime() -
              new Date(`${startDate}T12:00:00`).getTime()) /
              86400000,
          ),
        )
      : 0
  const rentalTotal = rentalItem ? rentalDays * rentalItem.price : 0
  const canSubmit =
    rentalDays > 0 &&
    !submitting &&
    !availabilityLoading &&
    availability?.esta_disponible === true

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMenuOpen(false)
  }

  // Envío real de la cotización (POST /cotizaciones).
  const submitRental = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rentalItem?.id || !canSubmit) return
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
        equipos_ids: [rentalItem.id],
      })
      const request: RentalRequest = {
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
      }
      setLastRequest(request)
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

  const openRental = (item: RentalItem) => {
    setRentalItem(item)
    setSubmitted(false)
    setStartDate("")
    setEndDate("")
    setLastRequest(null)
    setSubmitError(null)
  }

  const silentReloadCatalog = useCallback(
    () => reloadCatalog(false),
    [reloadCatalog],
  )

  if (adminOpen && adminUser) {
    return (
      <AdminView
        adminUser={adminUser}
        products={products}
        onExit={() => setAdminOpen(false)}
        onLogout={handleAdminLogout}
        onReloadCatalog={silentReloadCatalog}
      />
    )
  }

  return (
    <div className="min-h-full bg-snow text-slate">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate/90 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => scrollTo("home")}
            aria-label="Inicio de Punto Cumbre Outdoor"
          >
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
              <img
                src={logoImg}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <span>
              <span className="font-display block text-xl font-bold uppercase leading-none tracking-[0.08em]">
                Punto Cumbre
              </span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
                Arriendo y reparación
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-9 lg:flex">
            <button
              onClick={() => scrollTo("rental")}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Arriendo de equipos
            </button>
            <button
              onClick={() => scrollTo("repairs")}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Servicio de reparación
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Contacto
            </button>
            <button
              onClick={handleOpenAdmin}
              className="flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              <Icon name="admin" className="h-4 w-4" />{" "}
              {adminUser ? `Panel (${adminUser.username})` : "Administrador"}
            </button>
          </nav>

          <div className="hidden lg:block">
            <Button
              variant="primary"
              className="min-h-10 px-5"
              onClick={() => scrollTo("rental")}
            >
              Planifica tu expedición
            </Button>
          </div>
          <button
            className="p-2 text-white lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir navegación"
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-slate px-5 py-4 lg:hidden">
            <button
              onClick={() => scrollTo("rental")}
              className="block w-full py-3 text-left text-sm"
            >
              Arriendo de equipos
            </button>
            <button
              onClick={() => scrollTo("repairs")}
              className="block w-full py-3 text-left text-sm"
            >
              Servicio de reparación
            </button>
            <button
              onClick={() => scrollTo("contact")}
              className="block w-full py-3 text-left text-sm"
            >
              Contacto
            </button>
            <button
              onClick={handleOpenAdmin}
              className="block w-full py-3 text-left text-sm"
            >
              {adminUser
                ? `Panel administrador (${adminUser.username})`
                : "Vista administrador"}
            </button>
          </div>
        )}
      </header>

      <main>
        <section
          id="home"
          className="relative flex min-h-[760px] items-end overflow-hidden pt-20 lg:min-h-[820px]"
        >
          <img
            src="https://images.unsplash.com/photo-1705256529284-cff5fe3187c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=88&w=1800"
            alt="Montañista ascendiendo una ladera alpina nevada"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate via-slate/75 to-slate/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate/75 via-transparent to-slate/20" />

          <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 text-white lg:px-8 lg:pb-24">
            <div className="max-w-4xl">
              <SectionLabel light>
                Especialistas en equipo de montaña
              </SectionLabel>
              <h1 className="font-display max-w-4xl text-6xl font-bold uppercase leading-[0.88] tracking-[-0.02em] sm:text-7xl lg:text-[104px]">
                Equipa y repara para tu{" "}
                <span className="text-orange-soft">próxima expedición</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
                Arriendo de equipo técnico y reparación especializada para
                quienes dependen de su equipamiento en terrenos exigentes.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button variant="primary" onClick={() => scrollTo("rental")}>
                  Arrendar equipo <Icon name="arrow" />
                </Button>
                <Button variant="light" onClick={() => scrollTo("repairs")}>
                  Reparar mi equipo <Icon name="tool" />
                </Button>
              </div>
            </div>

            <div className="mt-14 grid max-w-2xl grid-cols-3 border-t border-white/20 pt-6">
              {[
                ["01", "Equipo certificado"],
                ["02", "Taller especializado"],
                ["03", "Listo para terreno"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="border-l border-white/20 pl-4 first:border-l-0 first:pl-0 sm:pl-6"
                >
                  <div className="font-display text-lg font-bold text-orange-soft">
                    {number}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/55 sm:text-xs">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-0 px-5 sm:grid-cols-3 lg:px-8">
            {[
              [
                "shield",
                "Revisado antes de cada arriendo",
                "Nuestro equipo limpia, inspecciona y ajusta cada pieza.",
              ],
              [
                "crampon",
                "Asesoría para un ajuste preciso",
                "Te ayudamos a elegir la fijación correcta para tu bota y objetivo.",
              ],
              [
                "tool",
                "Reparaciones hechas para durar",
                "Trabajo especializado enfocado en recuperar el rendimiento en terreno.",
              ],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="flex gap-4 border-b border-slate/10 py-7 sm:border-b-0 sm:border-r sm:px-7 sm:first:pl-0 sm:last:border-r-0"
              >
                <Icon
                  name={icon as IconName}
                  className="h-6 w-6 shrink-0 text-orange"
                />
                <div>
                  <h2 className="font-display text-lg font-semibold uppercase tracking-wide">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate/55">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="rental"
          className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"
        >
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <SectionLabel>Arriendo de equipos</SectionLabel>
              <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] sm:text-6xl">
                El agarre correcto para cada ruta
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate/60 sm:text-base">
              Desde travesías clásicas en glaciar hasta hielo vertical, nuestros
              crampones reciben mantención y ajuste para un desempeño confiable.
            </p>
          </div>

          {catalogLoading && (
            <div className="mt-12 border border-slate/10 bg-white p-8 text-center text-sm text-slate/55">
              Cargando catálogo de equipos...
            </div>
          )}

          {!catalogLoading && catalogError && (
            <div className="mt-12 flex flex-col items-center gap-4 border border-orange/30 bg-white p-8 text-center">
              <p className="text-sm text-slate/70">
                No pudimos cargar el catálogo: {catalogError}
              </p>
              <Button
                variant="outline"
                onClick={() => void reloadCatalog(true)}
              >
                Reintentar
              </Button>
            </div>
          )}

          {!catalogLoading && !catalogError && products.length === 0 && (
            <div className="mt-12 border border-slate/10 bg-white p-8 text-center text-sm text-slate/55">
              Aún no hay equipos publicados para arriendo.
            </div>
          )}

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((item, index) => (
              <article
                key={item.id ?? item.name}
                className="group flex flex-col overflow-hidden border border-slate/12 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-orange/60 hover:shadow-[0_18px_50px_rgba(23,32,38,0.12)]"
              >
                <div className="relative h-64 overflow-hidden bg-slate">
                  <img
                    src={item.image}
                    alt={`${item.name} en uso en terreno alpino`}
                    className="h-full w-full object-cover grayscale-[20%] transition-transform duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate/80 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4 bg-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    {item.tag}
                  </div>
                  <div className="absolute bottom-4 left-4 font-display text-5xl font-bold text-white/20">
                    0{index + 1}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-orange">
                    {item.use}
                  </div>
                  <h3 className="mt-2 font-display text-2xl font-bold uppercase leading-none">
                    {item.name}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-slate/55">
                    {item.detail}
                  </p>
                  <div className="mt-5 flex items-end justify-between border-t border-slate/10 pt-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate/35">
                        Desde
                      </div>
                      <div className="font-display text-2xl font-bold">
                        {currency.format(item.price)}
                        <span className="text-sm text-slate/40"> / día</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => openRental(item)}
                  >
                    Arrendar ahora <Icon name="arrow" />
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 flex flex-col items-start justify-between gap-4 border border-slate/10 bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Icon
                name="calendar"
                className="mt-0.5 h-5 w-5 shrink-0 text-orange"
              />
              <p className="text-sm leading-relaxed text-slate/60">
                <strong className="text-slate">
                  La disponibilidad depende de las fechas seleccionadas.
                </strong>{" "}
                Envía tu solicitud y confirmaremos stock, ajuste y detalles del
                retiro.
              </p>
            </div>
            <Button
              variant="dark"
              className="shrink-0"
              onClick={() => products[0] && openRental(products[0])}
              disabled={products.length === 0}
            >
              Consultar disponibilidad
            </Button>
          </div>
        </section>

        <section id="repairs" className="bg-slate py-24 text-white lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <SectionLabel light>Taller de reparación</SectionLabel>
                <h2 className="font-display text-5xl font-bold uppercase leading-[0.92] sm:text-6xl">
                  Mantén tu equipo de confianza en terreno
                </h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-white/58 lg:justify-self-end">
                Antes de reemplazar el equipo que conoces, deja que nuestro
                taller lo evalúe. Reparamos desgaste crítico con materiales
                durables y recomendaciones honestas.
              </p>
            </div>

            <div className="mt-14 grid border-y border-white/12 lg:grid-cols-3">
              {SERVICES.map((service, index) => (
                <article
                  key={service.title}
                  className="group border-b border-white/12 py-9 last:border-b-0 lg:border-b-0 lg:border-r lg:px-9 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center border border-orange/50 text-orange-soft transition-colors group-hover:bg-orange group-hover:text-white">
                      <Icon name={service.icon} className="h-7 w-7" />
                    </span>
                    <span className="font-display text-5xl font-bold text-white/[0.06]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-8 font-display text-3xl font-bold uppercase">
                    {service.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                    {service.detail}
                  </p>
                  <div className="mt-7 border-t border-white/10 pt-5 text-xs font-semibold uppercase tracking-[0.12em] text-orange-soft">
                    {service.work}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 flex flex-col justify-between gap-6 border border-white/12 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:p-8">
              <div>
                <h3 className="font-display text-2xl font-bold uppercase">
                  ¿No sabes si se puede reparar?
                </h3>
                <p className="mt-2 text-sm text-white/50">
                  Envíanos algunas fotos. Nuestro taller evaluará el daño antes
                  de tu visita.
                </p>
              </div>
              <Button
                variant="primary"
                className="shrink-0"
                onClick={() => scrollTo("contact")}
              >
                Solicitar evaluación <Icon name="arrow" />
              </Button>
            </div>
          </div>
        </section>

        <section id="contact" className="bg-orange text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">
                Listos para la montaña
              </div>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase sm:text-5xl">
                Conversa con quienes conocen el equipo
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
                Visita nuestro taller en Santiago o contáctanos para consultar
                disponibilidad y evaluar reparaciones.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="mailto:hola@puntocumbre.cl"
                className="inline-flex min-h-12 items-center gap-3 border border-white/35 px-5 text-sm font-semibold transition-colors hover:bg-white hover:text-orange"
              >
                <Icon name="mail" /> hola@puntocumbre.cl
              </a>
              <a
                href="tel:+56961428080"
                className="inline-flex min-h-12 items-center gap-3 border border-white/35 px-5 text-sm font-semibold transition-colors hover:bg-white hover:text-orange"
              >
                <Icon name="phone" /> +56 9 6142 8080
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-white">
              <img
                src={logoImg}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <div className="font-display text-lg font-bold uppercase tracking-wider">
                Punto Cumbre Outdoor
              </div>
              <div className="text-xs text-white/35">
                Arriendo de equipos · Reparaciones técnicas
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <Icon name="map" className="h-4 w-4" /> Santiago, Chile · © 2026
          </div>
        </div>
      </footer>

      {rentalItem && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/85 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setRentalItem(null)
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
                  onClick={() => setRentalItem(null)}
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
                      {rentalItem.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate/55">
                      Indícanos tus fechas para confirmar disponibilidad y
                      ajuste.
                    </p>
                  </div>
                  <button
                    className="p-2 text-slate/45 hover:text-slate"
                    onClick={() => setRentalItem(null)}
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
                      <span>{currency.format(rentalItem.price)} / día</span>
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
                    {submitting ? "Enviando solicitud..." : "Reservar y continuar compra"}{" "}
                    <Icon name="arrow" />
                  </Button>
                  <p className="text-center text-[11px] text-slate/40">
                    La reserva no genera un cobro automático. El pago se
                    coordina en el siguiente paso.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {adminLoginOpen && (
        <AdminLogin
          onClose={() => setAdminLoginOpen(false)}
          onSuccess={(profile) => {
            setAdminUser(profile)
            setAdminLoginOpen(false)
            setAdminOpen(true)
          }}
        />
      )}
    </div>
  )
}
