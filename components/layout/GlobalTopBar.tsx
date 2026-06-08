"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const pageLabels: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/operations-center": "Centro operativo",
  "/clients": "Clientes",
  "/installations": "Instalaciones",
  "/follow-ups": "Mantenimientos",
  "/calendar": "Calendario",
  "/contact-attempts": "Intentos de contacto",
  "/finances": "Finanzas",
  "/admin/users": "Personal y accesos",
  "/settings": "Configuración",
};

function getCurrentPageLabel(pathname: string) {
  const matchedRoute = Object.keys(pageLabels)
    .sort((a, b) => b.length - a.length)
    .find((route) => {
      if (route === "/") {
        return pathname === "/";
      }

      return pathname === route || pathname.startsWith(`${route}/`);
    });

  return matchedRoute ? pageLabels[matchedRoute] : "Operaciones";
}

export default function GlobalTopBar() {
  const pathname = usePathname();
  const currentPageLabel = getCurrentPageLabel(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-[1800px] items-center justify-between gap-4 px-4 lg:px-6">
        <nav
          aria-label="Ubicación actual"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold"
        >
          <Link
            href="/"
            className="truncate text-blue-700 transition hover:text-blue-800"
          >
            Operaciones 360
          </Link>

          <span className="text-slate-300">/</span>

          <span className="truncate text-slate-800">{currentPageLabel}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            title="Búsqueda global - próximamente"
            aria-label="Búsqueda global - próximamente"
            className="inline-flex h-8 w-8 cursor-default items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <SearchIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Notificaciones - próximamente"
            aria-label="Notificaciones - próximamente"
            className="relative inline-flex h-8 w-8 cursor-default items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <BellIcon className="h-4 w-4" />

            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              3
            </span>
          </button>

          <button
            type="button"
            title="Ayuda - próximamente"
            aria-label="Ayuda - próximamente"
            className="hidden h-8 w-8 cursor-default items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 sm:inline-flex"
          >
            <HelpIcon className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Perfil de usuario - próximamente"
            aria-label="Perfil de usuario - próximamente"
            className="inline-flex cursor-default items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              J
            </span>

            <span className="hidden md:inline">José Admin</span>

            <ChevronDownIcon className="hidden h-4 w-4 text-slate-400 md:block" />
          </button>
        </div>
      </div>
    </header>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BellIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HelpIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.75 9.75a2.5 2.5 0 0 1 4.5 1.5c0 1.75-2.25 2-2.25 3.5" />
      <path d="M12 17.25h.01" />
    </svg>
  );
}

function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
