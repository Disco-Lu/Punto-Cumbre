import type { ReactNode } from "react"

export type IconName =
  | "arrow"
  | "admin"
  | "backpack"
  | "calendar"
  | "cart"
  | "check"
  | "close"
  | "crampon"
  | "dashboard"
  | "edit"
  | "jacket"
  | "lock"
  | "logout"
  | "mail"
  | "map"
  | "menu"
  | "package"
  | "phone"
  | "plus"
  | "shield"
  | "tent"
  | "tool"
  | "trash"

const PATHS: Record<IconName, ReactNode> = {
  arrow: <path d="M4 12h15M14 6l6 6-6 6" />,
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
    <path d="M3 9h18M5 9l2 7h10l2-7M8 9V5M16 9V5M7 16l-2 4M12 16v5M17 16l2 4" />
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
  logout: <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />,
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
    <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
  ),
}

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName
  className?: string
}) {
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
      {PATHS[name]}
    </svg>
  )
}
