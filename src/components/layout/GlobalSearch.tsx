"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, CalendarDays, CheckSquare, Users, StickyNote, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SearchResult {
  id: string;
  type: "event" | "task" | "client" | "note";
  title: string;
  subtitle?: string;
  href: string;
}

const TYPE_META = {
  event: { label: "Eventos", icon: CalendarDays, color: "text-[#f0c040]" },
  task: { label: "Tarefas", icon: CheckSquare, color: "text-[#60a5fa]" },
  client: { label: "Clientes", icon: Users, color: "text-[#22c55e]" },
  note: { label: "Notas", icon: StickyNote, color: "text-[#a78bfa]" },
};

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  const search = useCallback(
    async (q: string) => {
      if (!user || q.trim().length < 2) { setResults([]); return; }
      setLoading(true);
      const like = `%${q}%`;

      const [evRes, taskRes, clientRes, noteRes] = await Promise.all([
        supabase.from("events").select("id,title,start_time").eq("user_id", user.id).ilike("title", like).limit(5),
        supabase.from("tasks").select("id,title,due_date").eq("user_id", user.id).ilike("title", like).limit(5),
        supabase.from("clients").select("id,name,contact_email").eq("user_id", user.id).ilike("name", like).limit(5),
        supabase.from("notes").select("id,title,content").eq("user_id", user.id).or(`title.ilike.${like},content.ilike.${like}`).limit(5),
      ]);

      const items: SearchResult[] = [
        ...(evRes.data || []).map((e) => ({
          id: e.id,
          type: "event" as const,
          title: e.title,
          subtitle: e.start_time ? format(parseISO(e.start_time), "dd 'de' MMM 'às' HH:mm", { locale: ptBR }) : undefined,
          href: "/dashboard/calendar",
        })),
        ...(taskRes.data || []).map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          subtitle: t.due_date ? `Prazo: ${format(parseISO(t.due_date), "dd/MM/yyyy")}` : undefined,
          href: "/tasks",
        })),
        ...(clientRes.data || []).map((c) => ({
          id: c.id,
          type: "client" as const,
          title: c.name,
          subtitle: c.contact_email || undefined,
          href: `/dashboard/clients/${c.id}`,
        })),
        ...(noteRes.data || []).map((n) => ({
          id: n.id,
          type: "note" as const,
          title: n.title,
          subtitle: n.content?.slice(0, 60) || undefined,
          href: "/notes",
        })),
      ];

      setResults(items);
      setSelected(0);
      setLoading(false);
    },
    [user]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) {
      router.push(results[selected].href);
      onClose();
    }
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  // Group by type
  const grouped = (["event", "task", "client", "note"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3a3a4a]">
          <Search className="w-5 h-5 text-[#666] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar eventos, tarefas, clientes, notas..."
            className="flex-1 bg-transparent outline-none text-[#e8e8e8] placeholder-[#555] chalk-text text-base"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 hover:bg-white/5 rounded-lg">
              <X className="w-4 h-4 text-[#666]" />
            </button>
          )}
          <kbd className="hidden sm:block text-[10px] text-[#555] border border-[#3a3a4a] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-6 text-center text-[#555] chalk-text text-sm">Buscando...</div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-6 text-center text-[#555] chalk-text text-sm">
              Nenhum resultado para "{query}"
            </div>
          )}
          {!loading && query.length < 2 && (
            <div className="p-6 text-center text-[#555] chalk-text text-sm">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
          {grouped.map(({ type, items }) => {
            const meta = TYPE_META[type];
            const Icon = meta.icon;
            return (
              <div key={type}>
                <div className="px-4 py-2 flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                  <span className="text-[10px] text-[#555] uppercase tracking-wider">{meta.label}</span>
                </div>
                {items.map((item) => {
                  const globalIdx = results.indexOf(item);
                  const isSelected = globalIdx === selected;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { router.push(item.href); onClose(); }}
                      onMouseEnter={() => setSelected(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-white/5" : "hover:bg-white/3"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="chalk-text text-[#e8e8e8] text-sm truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-[#666] truncate mt-0.5">{item.subtitle}</p>
                        )}
                      </div>
                      {isSelected && <ArrowRight className="w-4 h-4 text-[#555] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
