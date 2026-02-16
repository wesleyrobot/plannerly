"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, CalendarDays, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

interface Metrics {
  totalClients: number;
  totalRevenue: number;
  eventsThisWeek: number;
  overdueTasks: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function MetricsBar() {
  const { user } = useAuth();
  const supabase = createClient();
  const [metrics, setMetrics] = useState<Metrics>({
    totalClients: 0,
    totalRevenue: 0,
    eventsThisWeek: 0,
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchMetrics() {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      const [clientsRes, eventsRes, tasksRes] = await Promise.all([
        supabase
          .from("clients")
          .select("contract_value")
          .eq("user_id", user!.id),
        supabase
          .from("events")
          .select("id")
          .eq("user_id", user!.id)
          .gte("start_time", weekStart.toISOString())
          .lte("start_time", weekEnd.toISOString()),
        supabase
          .from("tasks")
          .select("id")
          .eq("user_id", user!.id)
          .eq("completed", false)
          .lt("due_date", startOfDay(now).toISOString()),
      ]);

      const clients = clientsRes.data || [];
      const totalRevenue = clients.reduce(
        (sum, c) => sum + (c.contract_value || 0),
        0
      );

      setMetrics({
        totalClients: clients.length,
        totalRevenue,
        eventsThisWeek: eventsRes.data?.length || 0,
        overdueTasks: tasksRes.data?.length || 0,
      });
      setLoading(false);
    }

    fetchMetrics();
  }, [user]);

  const cards = [
    {
      label: "Total de Clientes",
      value: loading ? "..." : String(metrics.totalClients),
      icon: Users,
      iconColor: "text-[#60a5fa]",
      bg: "bg-[#60a5fa]/10",
    },
    {
      label: "Receita Total",
      value: loading ? "..." : formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      iconColor: "text-[#22c55e]",
      bg: "bg-[#22c55e]/10",
    },
    {
      label: "Eventos esta semana",
      value: loading ? "..." : String(metrics.eventsThisWeek),
      icon: CalendarDays,
      iconColor: "text-[#f0c040]",
      bg: "bg-[#f0c040]/10",
    },
    {
      label: "Tarefas em atraso",
      value: loading ? "..." : String(metrics.overdueTasks),
      icon: AlertCircle,
      iconColor: metrics.overdueTasks > 0 ? "text-[#f87171]" : "text-[#888]",
      bg: metrics.overdueTasks > 0 ? "bg-[#f87171]/10" : "bg-[#888]/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3a3a4a] animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-2.5 w-20 bg-[#3a3a4a] rounded animate-pulse" />
              <div className="h-5 w-16 bg-[#3a3a4a] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl p-4 flex items-center gap-3"
          >
            <div className={`${card.bg} p-2.5 rounded-xl`}>
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-[#666] uppercase tracking-wider leading-none mb-1">
                {card.label}
              </p>
              <p className="chalk-text text-lg font-bold text-[#e8e8e8] truncate">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
