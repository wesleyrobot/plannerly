"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  CheckSquare,
  StickyNote,
  Users,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Planner", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Calendário", icon: Calendar },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/tasks", label: "Tarefas", icon: CheckSquare },
  { href: "/notes", label: "Notas", icon: StickyNote },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-16 h-screen bg-[#161622] border-r border-[#2a2a3a] flex flex-col items-center fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="py-5">
        <div className="w-10 h-10 bg-[#f0c040] rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-[#1e1e2e]" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 pt-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-[#f0c040]/15 text-[#f0c040]"
                  : "text-[#666] hover:bg-white/5 hover:text-[#a0a0b0]"
              }`}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="pb-4 flex flex-col items-center gap-2">
        {user && (
          <div className="w-8 h-8 bg-[#2a2a3a] rounded-full flex items-center justify-center" title={user.email || ""}>
            <span className="text-xs font-medium text-[#a0a0b0]">
              {user.email?.[0].toUpperCase()}
            </span>
          </div>
        )}
        <button
          onClick={signOut}
          title="Sair"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#666] hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
