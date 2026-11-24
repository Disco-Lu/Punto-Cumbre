import { lazy, Suspense, useCallback, useEffect, useState } from "react"
import {
  ApiClientError,
  getAdminProfile,
  getEquipos,
  isAuthenticated,
  logoutAdmin,
  type AdminProfile,
} from "@/api"
import { CatalogSection } from "@/components/public/CatalogSection"
import { Header } from "@/components/public/Header"
import {
  Footer,
  HeroAndBenefits,
  RepairsAndContact,
} from "@/components/public/LandingSections"
import { RentalModal } from "@/components/public/RentalModal"
import { toRentalItem, type RentalItem } from "@/lib/adapters"

// Green Software (Code Splitting): el panel admin y su modal de login solo se descargan
// cuando alguien realmente intenta acceder al panel administrativo.
const AdminView = lazy(() => import("@/components/admin/AdminView"))
const AdminLogin = lazy(() => import("@/components/admin/AdminLogin"))

export default function App() {
  const [adminUser, setAdminUser] = useState<AdminProfile | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [rentalItem, setRentalItem] = useState<RentalItem | null>(null)
  const [products, setProducts] = useState<RentalItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)

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

  const silentReloadCatalog = useCallback(
    () => reloadCatalog(false),
    [reloadCatalog],
  )

  // Valida sesión JWT persistida en sessionStorage.
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

  // Carga inicial del catálogo desde FastAPI.
  useEffect(() => {
    void reloadCatalog(true)
  }, [reloadCatalog])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const handleOpenAdmin = () => {
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

  if (adminOpen && adminUser) {
    return (
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center bg-snow text-sm text-slate/55">
            Cargando panel administrativo...
          </div>
        }
      >
        <AdminView
          adminUser={adminUser}
          products={products}
          onExit={() => setAdminOpen(false)}
          onLogout={handleAdminLogout}
          onReloadCatalog={silentReloadCatalog}
        />
      </Suspense>
    )
  }

  return (
    <div className="min-h-full bg-snow text-slate">
      <Header
        adminUser={adminUser}
        onScrollTo={scrollTo}
        onOpenAdmin={handleOpenAdmin}
      />

      <main>
        <HeroAndBenefits onScrollTo={scrollTo} />
        <CatalogSection
          products={products}
          loading={catalogLoading}
          error={catalogError}
          onRetry={() => void reloadCatalog(true)}
          onSelectItem={setRentalItem}
        />
        <RepairsAndContact onScrollTo={scrollTo} />
      </main>

      <Footer />

      {rentalItem && (
        <RentalModal item={rentalItem} onClose={() => setRentalItem(null)} />
      )}

      {adminLoginOpen && (
        <Suspense fallback={null}>
          <AdminLogin
            onClose={() => setAdminLoginOpen(false)}
            onSuccess={(profile) => {
              setAdminUser(profile)
              setAdminLoginOpen(false)
              setAdminOpen(true)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
