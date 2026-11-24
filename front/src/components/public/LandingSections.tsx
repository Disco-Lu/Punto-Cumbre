import logoImg from "@/imports/punto-cumbre-logo.png"
import { Icon, type IconName } from "@/components/ui/Icon"
import { Button, SectionLabel } from "@/components/ui/primitives"

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

const BENEFITS: [IconName, string, string][] = [
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
]

export function HeroAndBenefits({
  onScrollTo,
}: {
  onScrollTo: (id: string) => void
}) {
  return (
    <>
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
              Arriendo de equipo técnico y reparación especializada para quienes
              dependen de su equipamiento en terrenos exigentes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button variant="primary" onClick={() => onScrollTo("rental")}>
                Arrendar equipo <Icon name="arrow" />
              </Button>
              <Button variant="light" onClick={() => onScrollTo("repairs")}>
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
          {BENEFITS.map(([icon, title, text]) => (
            <div
              key={title}
              className="flex gap-4 border-b border-slate/10 py-7 sm:border-b-0 sm:border-r sm:px-7 sm:first:pl-0 sm:last:border-r-0"
            >
              <Icon name={icon} className="h-6 w-6 shrink-0 text-orange" />
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
    </>
  )
}

export function RepairsAndContact({
  onScrollTo,
}: {
  onScrollTo: (id: string) => void
}) {
  return (
    <>
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
              Antes de reemplazar el equipo que conoces, deja que nuestro taller
              lo evalúe. Reparamos desgaste crítico con materiales durables y
              recomendaciones honestas.
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
                Envíanos algunas fotos. Nuestro taller evaluará el daño antes de
                tu visita.
              </p>
            </div>
            <Button
              variant="primary"
              className="shrink-0"
              onClick={() => onScrollTo("contact")}
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
    </>
  )
}

export function Footer() {
  return (
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
  )
}
