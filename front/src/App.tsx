import { FormEvent, ReactNode, useState } from "react"
import logoImg from "@/imports/punto-cumbre-logo.png"

type IconName = "arrow" | "admin" | "backpack" | "calendar" | "cart" | "check" | "close" | "crampon" | "dashboard" | "edit" | "jacket" | "lock" | "logout" | "mail" | "map" | "menu" | "mountain" | "package" | "phone" | "plus" | "shield" | "tent" | "tool" | "trash"

type RentalItem = {
  name: string
  use: string
  detail: string
  image: string
  tag: string
  price: number
}

type RequestStatus = "Nueva" | "Confirmada" | "En preparación" | "Entregada"

type RentalRequest = {
  id: string
  customer: string
  email: string
  item: string
  startDate: string
  endDate: string
  days: number
  total: number
  status: RequestStatus
}

const RENTAL_ITEMS: RentalItem[] = [
  {
    name: "Crampones de correas",
    use: "Ajuste flexible",
    detail:
      "Fijación universal para botas de trekking. Una opción confiable para travesías en glaciar y montañismo clásico.",
    tag: "10 puntas",
    price: 8500,
    image:
      "https://images.unsplash.com/photo-1485871800663-71856dc09ec4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  },
  {
    name: "Crampones semiautomáticos",
    use: "Alpinismo técnico",
    detail:
      "Fijación híbrida con bloqueo preciso en el talón. Diseñados para botas rígidas y terreno mixto.",
    tag: "12 puntas",
    price: 11000,
    image:
      "https://images.unsplash.com/photo-1579769696606-3a52f6d41b95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  },
  {
    name: "Crampones automáticos",
    use: "Máxima precisión",
    detail:
      "Rendimiento técnico para botas compatibles. Seguros, rígidos y rápidos de ajustar.",
    tag: "12 puntas",
    price: 13500,
    image:
      "https://images.unsplash.com/photo-1572037861810-0e1980e7f9fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  },
  {
    name: "Crampones para escalada en hielo",
    use: "Hielo vertical",
    detail:
      "Puntas frontales agresivas para terreno empinado, cascadas y escalada invernal exigente.",
    tag: "Mono / doble punta",
    price: 16000,
    image:
      "https://images.unsplash.com/photo-1485872987516-ec9b00fe7a65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900",
  },
]

const INITIAL_REQUESTS: RentalRequest[] = [
  {
    id: "PC-1048",
    customer: "Tomás Fuentes",
    email: "tomas@correo.cl",
    item: "Crampones semiautomáticos",
    startDate: "2026-05-18",
    endDate: "2026-05-21",
    days: 4,
    total: 44000,
    status: "Nueva",
  },
  {
    id: "PC-1047",
    customer: "Daniela Rojas",
    email: "daniela@correo.cl",
    item: "Crampones automáticos",
    startDate: "2026-05-14",
    endDate: "2026-05-16",
    days: 3,
    total: 40500,
    status: "Confirmada",
  },
  {
    id: "PC-1046",
    customer: "Ignacio Soto",
    email: "ignacio@correo.cl",
    item: "Crampones de correas",
    startDate: "2026-05-10",
    endDate: "2026-05-12",
    days: 3,
    total: 25500,
    status: "En preparación",
  },
]

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

const ADMIN_EMAIL = "admin@puntocumbre.cl"
const ADMIN_PASSWORD = "cumbre2026"

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(
    new Date(`${date}T12:00:00`),
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

function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    Nueva: "bg-orange/12 text-orange-dark",
    Confirmada: "bg-slate/10 text-slate",
    "En preparación": "bg-secondary/15 text-secondary",
    Entregada: "bg-muted text-muted-foreground",
  }

  return (
    <span
      className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  )
}

function AdminLogin({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [error, setError] = useState("")

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email")).trim().toLowerCase()
    const password = String(formData.get("password"))

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError("El correo o la contraseña no son correctos.")
      return
    }

    setError("")
    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/90 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div className="my-8 w-full max-w-md bg-white shadow-2xl">
        <div className="relative bg-slate px-7 py-8 text-white">
          <button
            className="absolute right-4 top-4 p-2 text-white/45 transition-colors hover:text-white"
            onClick={onClose}
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
            Correo electrónico
            <input
              required
              autoFocus
              name="email"
              type="email"
              autoComplete="username"
              placeholder="administrador@correo.cl"
              onChange={() => setError("")}
              className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
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
              onChange={() => setError("")}
              className="mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
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

          <Button type="submit" className="w-full">
            Ingresar al panel <Icon name="arrow" />
          </Button>
          <p className="text-center text-[11px] leading-relaxed text-slate/40">
            Acceso exclusivo para el equipo de Punto Cumbre Outdoor.
          </p>
        </form>
      </div>
    </div>
  )
}

function ProductEditor({
  product,
  onClose,
  onSave,
}: {
  product: RentalItem | null
  onClose: () => void
  onSave: (product: RentalItem) => void
}) {
  const [image, setImage] = useState(product?.image ?? "")

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSave({
      name: String(formData.get("name")).trim(),
      use: String(formData.get("use")).trim(),
      detail: String(formData.get("detail")).trim(),
      tag: String(formData.get("tag")).trim(),
      price: Number(formData.get("price")),
      image: String(formData.get("image")).trim(),
    })
  }

  const fieldClass =
    "mt-2 h-12 w-full border border-slate/15 bg-snow px-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate/90 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div className="my-8 w-full max-w-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate/10 p-6 sm:p-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange">
              Gestión de inventario
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold uppercase">
              {product ? "Editar producto" : "Nuevo producto"}
            </h2>
            <p className="mt-2 text-sm text-slate/50">
              Los cambios se reflejarán inmediatamente en el catálogo público.
            </p>
          </div>
          <button
            className="p-2 text-slate/45 transition-colors hover:text-slate"
            onClick={onClose}
            aria-label="Cerrar editor de producto"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={submitProduct} className="space-y-5 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Nombre del producto
              <input
                required
                autoFocus
                name="name"
                defaultValue={product?.name}
                placeholder="Ej. Piolet técnico"
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Tipo de uso
              <input
                required
                name="use"
                defaultValue={product?.use}
                placeholder="Ej. Alpinismo técnico"
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Etiqueta
              <input
                required
                name="tag"
                defaultValue={product?.tag}
                placeholder="Ej. 12 puntas"
                className={fieldClass}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate/55">
              Precio diario
              <input
                required
                min="1"
                name="price"
                type="number"
                defaultValue={product?.price}
                placeholder="12000"
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
            Descripción
            <textarea
              required
              rows={3}
              name="detail"
              defaultValue={product?.detail}
              placeholder="Describe las características principales del equipo"
              className="mt-2 w-full resize-none border border-slate/15 bg-snow p-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-slate/30 focus:border-orange"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate/55">
            URL de imagen
            <input
              required
              name="image"
              type="url"
              value={image}
              onChange={(event) => setImage(event.target.value)}
              placeholder="https://..."
              className={fieldClass}
            />
          </label>

          {image && (
            <div className="flex items-center gap-4 border border-slate/10 bg-snow p-3">
              <img
                src={image}
                alt="Vista previa del producto"
                className="h-20 w-24 object-cover"
              />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Vista previa
                </div>
                <p className="mt-1 text-xs text-slate/45">
                  Verifica que la imagen sea clara y represente el producto.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {product ? "Guardar cambios" : "Agregar producto"}{" "}
              <Icon name={product ? "check" : "plus"} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminView({
  requests,
  products,
  onExit,
  onStatusChange,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: {
  requests: RentalRequest[]
  products: RentalItem[]
  onExit: () => void
  onStatusChange: (id: string, status: RequestStatus) => void
  onAddProduct: (product: RentalItem) => void
  onUpdateProduct: (index: number, product: RentalItem) => void
  onDeleteProduct: (index: number) => void
}) {
  const [section, setSection] =
    useState<"resumen" | "solicitudes" | "inventario">("resumen")
  const [productEditor, setProductEditor] = useState<{
    product: RentalItem | null
    index: number | null
  } | null>(null)
  const pending = requests.filter((request) => request.status !== "Entregada")
  const revenue = requests.reduce((sum, request) => sum + request.total, 0)

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
        <button
          onClick={onExit}
          className="mt-8 flex min-h-12 w-full items-center gap-3 border-t border-white/10 px-4 pt-6 text-sm font-semibold text-white/55 transition-colors hover:text-white lg:mt-auto"
        >
          <Icon name="logout" className="h-5 w-5" /> Volver al sitio
        </button>
      </aside>

      <main className="p-5 sm:p-8 lg:p-12">
        <header className="flex flex-col justify-between gap-5 border-b border-slate/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <SectionLabel>Operación diaria</SectionLabel>
            <h1 className="font-display text-5xl font-bold uppercase leading-none">
              {section === "resumen"
                ? "Resumen general"
                : section === "solicitudes"
                  ? "Solicitudes de arriendo"
                  : "Inventario"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center bg-slate text-white">
              <Icon name="admin" />
            </span>
            <div>
              <div className="text-sm font-semibold">Administrador</div>
              <div className="text-xs text-slate/45">Operaciones Santiago</div>
            </div>
          </div>
        </header>

        {section === "resumen" && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Solicitudes activas", String(pending.length), "calendar"],
                ["Ingresos proyectados", currency.format(revenue), "cart"],
                ["Categorías disponibles", String(products.length), "package"],
              ].map(([label, value, icon]) => (
                <article
                  key={label}
                  className="border border-slate/10 bg-white p-6"
                >
                  <div className="flex items-center justify-between text-orange">
                    <Icon name={icon as IconName} className="h-6 w-6" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate/35">
                      Este mes
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
                  Ver todas
                </button>
              </div>
              <RequestsTable
                requests={requests.slice(0, 3)}
                onStatusChange={onStatusChange}
              />
            </div>
          </>
        )}

        {section === "solicitudes" && (
          <div className="mt-8">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-slate/55">
                {requests.length} solicitudes registradas
              </p>
              <Button variant="dark" className="min-h-10">
                Exportar listado
              </Button>
            </div>
            <RequestsTable
              requests={requests}
              onStatusChange={onStatusChange}
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
                  {products.length} productos publicados para arriendo
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={() => setProductEditor({ product: null, index: null })}
              >
                <Icon name="plus" /> Agregar producto
              </Button>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {products.map((item, index) => (
                  <article
                    key={`${item.name}-${index}`}
                    className="flex gap-5 border border-slate/10 bg-white p-5"
                  >
                    <img
                      src={item.image}
                      alt=""
                      className="h-28 w-28 shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-orange">
                        {item.use}
                      </div>
                      <h3 className="mt-1 font-display text-xl font-bold uppercase leading-none">
                        {item.name}
                      </h3>
                      <div className="mt-3 text-sm font-semibold">
                        {currency.format(item.price)}{" "}
                        <span className="font-normal text-slate/40">/ día</span>
                      </div>
                      <div className="mt-4 flex items-center gap-4 border-t border-slate/10 pt-3">
                        <button
                          onClick={() =>
                            setProductEditor({ product: item, index })
                          }
                          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate/55 transition-colors hover:text-orange"
                        >
                          <Icon name="edit" className="h-4 w-4" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Eliminar "${item.name}" del catálogo?`,
                              )
                            ) {
                              onDeleteProduct(index)
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate/40 transition-colors hover:text-orange-dark"
                        >
                          <Icon name="trash" className="h-4 w-4" /> Eliminar
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
                  Agrega el primer producto para publicarlo en el catálogo.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {productEditor && (
        <ProductEditor
          product={productEditor.product}
          onClose={() => setProductEditor(null)}
          onSave={(product) => {
            if (productEditor.index === null) {
              onAddProduct(product)
            } else {
              onUpdateProduct(productEditor.index, product)
            }
            setProductEditor(null)
          }}
        />
      )}
    </div>
  )
}

function RequestsTable({
  requests,
  onStatusChange,
}: {
  requests: RentalRequest[]
  onStatusChange: (id: string, status: RequestStatus) => void
}) {
  const nextStatus: Record<RequestStatus, RequestStatus> = {
    Nueva: "Confirmada",
    Confirmada: "En preparación",
    "En preparación": "Entregada",
    Entregada: "Entregada",
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
          {requests.map((request) => (
            <tr
              key={request.id}
              className="border-b border-slate/8 last:border-b-0"
            >
              <td className="p-4 text-xs font-bold text-orange">
                {request.id}
              </td>
              <td className="p-4">
                <div className="text-sm font-semibold">{request.customer}</div>
                <div className="mt-1 text-xs text-slate/45">{request.item}</div>
              </td>
              <td className="p-4 text-xs text-slate/55">
                {formatDate(request.startDate)} — {formatDate(request.endDate)}
              </td>
              <td className="p-4 text-sm font-semibold">
                {currency.format(request.total)}
              </td>
              <td className="p-4">
                <StatusBadge status={request.status} />
              </td>
              <td className="p-4 text-right">
                {request.status !== "Entregada" ? (
                  <button
                    onClick={() =>
                      onStatusChange(request.id, nextStatus[request.status])
                    }
                    className="text-xs font-bold uppercase tracking-wider text-slate transition-colors hover:text-orange"
                  >
                    Avanzar estado
                  </button>
                ) : (
                  <span className="text-xs text-slate/30">Completada</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function App() {
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [rentalItem, setRentalItem] = useState<RentalItem | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [lastRequest, setLastRequest] = useState<RentalRequest | null>(null)
  const [requests, setRequests] = useState<RentalRequest[]>(INITIAL_REQUESTS)
  const [products, setProducts] = useState<RentalItem[]>(RENTAL_ITEMS)

  const rentalDays =
    startDate && endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(`${endDate}T12:00:00`).getTime() -
              new Date(`${startDate}T12:00:00`).getTime()) /
              86400000,
          ) + 1,
        )
      : 0
  const rentalTotal = rentalItem ? rentalDays * rentalItem.price : 0

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    setMenuOpen(false)
  }

  const submitRental = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rentalItem || rentalDays < 1) return
    const formData = new FormData(event.currentTarget)
    const request: RentalRequest = {
      id: `PC-${1049 + requests.length - INITIAL_REQUESTS.length}`,
      customer: String(formData.get("name")),
      email: String(formData.get("email")),
      item: rentalItem.name,
      startDate,
      endDate,
      days: rentalDays,
      total: rentalTotal,
      status: "Nueva",
    }
    setRequests((current) => [request, ...current])
    setLastRequest(request)
    setSubmitted(true)
  }

  const openRental = (item: RentalItem) => {
    setRentalItem(item)
    setSubmitted(false)
    setStartDate("")
    setEndDate("")
    setLastRequest(null)
  }

  if (adminOpen) {
    return (
      <AdminView
        requests={requests}
        products={products}
        onExit={() => setAdminOpen(false)}
        onStatusChange={(id, status) =>
          setRequests((current) =>
            current.map((request) =>
              request.id === id ? { ...request, status } : request,
            ),
          )
        }
        onAddProduct={(product) =>
          setProducts((current) => [...current, product])
        }
        onUpdateProduct={(index, product) =>
          setProducts((current) =>
            current.map((item, itemIndex) =>
              itemIndex === index ? product : item,
            ),
          )
        }
        onDeleteProduct={(index) =>
          setProducts((current) =>
            current.filter((_, itemIndex) => itemIndex !== index),
          )
        }
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
              onClick={() => setAdminLoginOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              <Icon name="admin" className="h-4 w-4" /> Administrador
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
              onClick={() => {
                setMenuOpen(false)
                setAdminLoginOpen(true)
              }}
              className="block w-full py-3 text-left text-sm"
            >
              Vista administrador
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

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((item, index) => (
              <article
                key={item.name}
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
                  </div>
                  <Button
                    type="submit"
                    disabled={rentalDays < 1}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reservar y continuar compra <Icon name="arrow" />
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
          onSuccess={() => {
            setAdminLoginOpen(false)
            setAdminOpen(true)
          }}
        />
      )}
    </div>
  )
}
