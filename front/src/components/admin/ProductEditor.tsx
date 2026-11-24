import { FormEvent, useState } from "react"
import { ApiClientError, type Categoria } from "@/api"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/primitives"
import type { RentalItem } from "@/lib/adapters"

export type ProductFormData = {
  id_categoria: number
  nombre_equipo: string
  caracteristicas: string
  precio_arriendo: number
  cantidad: number
}

export function ProductEditor({
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
              Los cambios se guardarán en Supabase y se reflejarán en el
              catálogo público.
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
