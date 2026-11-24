import { useState } from "react"
import logoImg from "@/imports/punto-cumbre-logo.png"
import type { AdminProfile } from "@/api"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/primitives"

export function Header({
  adminUser,
  onScrollTo,
  onOpenAdmin,
}: {
  adminUser: AdminProfile | null
  onScrollTo: (id: string) => void
  onOpenAdmin: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const navigate = (id: string) => {
    onScrollTo(id)
    setMenuOpen(false)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button
          className="flex items-center gap-3 text-left"
          onClick={() => navigate("home")}
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
            onClick={() => navigate("rental")}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Arriendo de equipos
          </button>
          <button
            onClick={() => navigate("repairs")}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Servicio de reparación
          </button>
          <button
            onClick={() => navigate("contact")}
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Contacto
          </button>
          <button
            onClick={onOpenAdmin}
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
            onClick={() => navigate("rental")}
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
            onClick={() => navigate("rental")}
            className="block w-full py-3 text-left text-sm"
          >
            Arriendo de equipos
          </button>
          <button
            onClick={() => navigate("repairs")}
            className="block w-full py-3 text-left text-sm"
          >
            Servicio de reparación
          </button>
          <button
            onClick={() => navigate("contact")}
            className="block w-full py-3 text-left text-sm"
          >
            Contacto
          </button>
          <button
            onClick={() => {
              setMenuOpen(false)
              onOpenAdmin()
            }}
            className="block w-full py-3 text-left text-sm"
          >
            {adminUser
              ? `Panel administrador (${adminUser.username})`
              : "Vista administrador"}
          </button>
        </div>
      )}
    </header>
  )
}
