import { FormEvent, useState } from "react"
import {
  ApiClientError,
  getAdminProfile,
  loginAdmin,
  logoutAdmin,
  type AdminProfile,
} from "@/api"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/primitives"

export default function AdminLogin({
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
