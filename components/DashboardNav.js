"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENUS = [
  { href: "/dashboard", label: "Pencapaian SLA", icon: "📊" },
  { href: "/dashboard/wo", label: "Work Order Digital", icon: "📋" },
  { href: "/dashboard/monitoring", label: "Unit Belum Terisi", icon: "⚠️" },
];

export default function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav className="w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen px-3 py-6">
      <div className="px-2 mb-8">
        <p className="font-bold text-gray-800">⛽ SLA Dashboard</p>
      </div>
      <div className="space-y-1">
        {MENUS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
              pathname === m.href ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
