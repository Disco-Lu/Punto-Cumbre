import type { ButtonHTMLAttributes, ReactNode } from "react"
import type { EstadoReserva } from "@/api"
import { STATUS_LABELS } from "@/lib/adapters"

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
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

export function SectionLabel({
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

export function StatusBadge({ status }: { status: EstadoReserva }) {
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
