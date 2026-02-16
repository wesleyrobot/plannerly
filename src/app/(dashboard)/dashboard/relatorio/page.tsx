"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, Users, TrendingUp, Award } from "lucide-react";
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientData {
  name: string;
  contract_value: number | null;
  stage_name: string | null;
  start_date: string | null;
}

interface MonthRevenue {
  month: string;
  label: string;
  value: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function RelatorioPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const { data } = await supabase
        .from("clients")
        .select("name, contract_value, stage_id, start_date, stages(name)")
        .eq("user_id", user!.id)
        .order("contract_value", { ascending: false, nullsFirst: false });

      const mapped = (data || []).map((c: Record<string, unknown>) => ({
        name: c.name as string,
        contract_value: c.contract_value as number | null,
        stage_name: (c.stages as { name?: string } | null)?.name || null,
        start_date: c.start_date as string | null,
      }));
      setClients(mapped);
      setLoading(false);
    }
    load();
  }, [user]);

  const totalRevenue = clients.reduce((s, c) => s + (c.contract_value || 0), 0);
  const activeClients = clients.filter((c) => c.contract_value && c.contract_value > 0);
  const avgRevenue = activeClients.length > 0 ? totalRevenue / activeClients.length : 0;
  const topClient = activeClients[0] || null;

  // Build last 6 months revenue from start_date
  const months: MonthRevenue[] = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const value = clients
      .filter((c) => {
        if (!c.start_date || !c.contract_value) return false;
        const sd = parseISO(c.start_date);
        return sd >= start && sd <= end;
      })
      .reduce((s, c) => s + (c.contract_value || 0), 0);
    return {
      month: format(d, "yyyy-MM"),
      label: format(d, "MMM", { locale: ptBR }),
      value,
    };
  });

  const maxMonth = Math.max(...months.map((m) => m.value), 1);

  if (loading) {
    return (
      <div className="chalkboard min-h-screen p-6">
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#2a2a3a] rounded-2xl animate-pulse border border-[#3a3a4a]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chalkboard min-h-screen p-6">
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="chalk-title text-2xl text-[#e8e8e8] tracking-widest mb-6">RELATÓRIO FINANCEIRO</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Receita Total", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
            { label: "Clientes Ativos", value: String(activeClients.length), icon: Users, color: "text-[#60a5fa]", bg: "bg-[#60a5fa]/10" },
            { label: "Ticket Médio", value: formatCurrency(avgRevenue), icon: TrendingUp, color: "text-[#f0c040]", bg: "bg-[#f0c040]/10" },
            { label: "Maior Contrato", value: topClient ? formatCurrency(topClient.contract_value || 0) : "—", icon: Award, color: "text-[#a78bfa]", bg: "bg-[#a78bfa]/10" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl p-4 flex items-center gap-3">
                <div className={`${card.bg} p-2.5 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#666] uppercase tracking-wider leading-none mb-1">{card.label}</p>
                  <p className="chalk-text text-base font-bold text-[#e8e8e8] truncate">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly chart */}
        <div className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl p-6 mb-6">
          <h2 className="chalk-title text-base text-[#e8e8e8] mb-6 tracking-wider">RECEITA POR MÊS (INÍCIO DE CONTRATO)</h2>
          <div className="flex items-end gap-3 h-40">
            {months.map((m) => {
              const pct = m.value > 0 ? (m.value / maxMonth) * 100 : 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#888]">
                    {m.value > 0 ? formatCurrency(m.value).replace("R$\u00a0", "R$") : ""}
                  </span>
                  <div className="w-full relative flex items-end" style={{ height: "100px" }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(pct, m.value > 0 ? 4 : 0)}%`,
                        background: m.value > 0
                          ? "linear-gradient(to top, #22c55e, #22c55e80)"
                          : "#2a2a3a",
                        border: m.value === 0 ? "1px dashed #3a3a4a" : "none",
                        minHeight: m.value === 0 ? "8px" : undefined,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-[#666] capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client table */}
        <div className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#3a3a4a]">
            <h2 className="chalk-title text-base text-[#e8e8e8] tracking-wider">CLIENTES POR REMUNERAÇÃO</h2>
          </div>
          {clients.length === 0 ? (
            <div className="p-8 text-center text-[#555] chalk-text">Nenhum cliente cadastrado.</div>
          ) : (
            <div className="divide-y divide-[#3a3a4a]">
              {clients.map((c, i) => {
                const pct = totalRevenue > 0 && c.contract_value ? (c.contract_value / totalRevenue) * 100 : 0;
                return (
                  <div key={c.name + i} className="px-5 py-3 flex items-center gap-4">
                    <span className="text-[#555] text-xs w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="chalk-text text-[#e8e8e8] text-sm truncate">{c.name}</p>
                      {c.stage_name && (
                        <p className="text-[10px] text-[#666]">{c.stage_name}</p>
                      )}
                    </div>
                    {c.contract_value && c.contract_value > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-[#22c55e] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="chalk-text text-[#22c55e] text-sm font-semibold whitespace-nowrap">
                          {formatCurrency(c.contract_value)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#555] text-xs">Sem contrato</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
