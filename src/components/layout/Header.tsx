"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {subtitle || today}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none w-64 text-gray-900 placeholder-gray-400"
            />
          </div>
          <button className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
