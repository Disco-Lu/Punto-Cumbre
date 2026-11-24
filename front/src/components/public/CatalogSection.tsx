import { Icon } from "@/components/ui/Icon"
import { Button, SectionLabel } from "@/components/ui/primitives"
import { currency, type RentalItem } from "@/lib/adapters"

export function CatalogSection({
  products,
  loading,
  error,
  onRetry,
  onSelectItem,
}: {
  products: RentalItem[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onSelectItem: (item: RentalItem) => void
}) {
  return (
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

      {loading && (
        <div className="mt-12 border border-slate/10 bg-white p-8 text-center text-sm text-slate/55">
          Cargando catálogo de equipos...
        </div>
      )}

      {!loading && error && (
        <div className="mt-12 flex flex-col items-center gap-4 border border-orange/30 bg-white p-8 text-center">
          <p className="text-sm text-slate/70">
            No pudimos cargar el catálogo: {error}
          </p>
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="mt-12 border border-slate/10 bg-white p-8 text-center text-sm text-slate/55">
          Aún no hay equipos publicados para arriendo.
        </div>
      )}

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((item, index) => (
          <article
            key={item.id}
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
                onClick={() => onSelectItem(item)}
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
          onClick={() => products[0] && onSelectItem(products[0])}
          disabled={products.length === 0}
        >
          Consultar disponibilidad
        </Button>
      </div>
    </section>
  )
}
