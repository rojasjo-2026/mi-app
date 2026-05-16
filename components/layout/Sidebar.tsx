import Link from "next/link";

const menuItems = [
  { href: "/", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
  { href: "/installations", label: "Instalaciones" },
  { href: "/follow-ups", label: "Mantenimientos" },
  { href: "/calendar", label: "Calendario" },
  { href: "/contact-attempts", label: "Intentos de contacto" },
  { href: "/finances", label: "Finanzas" },
  { href: "/admin/users", label: "Personal y accesos" },
  { href: "/settings", label: "Configuración" },
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-64 bg-slate-900 p-6 text-white">
      <h1 className="mb-8 text-xl font-bold">MI-APP</h1>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 transition hover:bg-slate-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
