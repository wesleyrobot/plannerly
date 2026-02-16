"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Client, ClientInsert, Stage, Event } from "@/types/database";
import ClientModal from "@/components/clients/ClientModal";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  DollarSign,
  CalendarDays,
  StickyNote,
  Pencil,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [client, setClient] = useState<Client | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    if (!user) return;
    const [clientRes, stagesRes, eventsRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("stages").select("*").eq("user_id", user.id).order("position"),
      supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .eq("client_id", id)
        .order("start_time", { ascending: true }),
    ]);
    setClient(clientRes.data || null);
    setStages(stagesRes.data || []);
    setEvents(eventsRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user, id]);

  const handleSave = async (data: ClientInsert) => {
    if (!client) return;
    await supabase.from("clients").update(data).eq("id", client.id);
    await load();
  };

  const handleDelete = async (clientId: string) => {
    await supabase.from("clients").delete().eq("id", clientId);
    router.push("/dashboard/clients");
  };

  const stageName = stages.find((s) => s.id === client?.stage_id)?.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full chalkboard">
        <div className="text-[#888] chalk-text">Carregando...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full chalkboard gap-4">
        <p className="text-[#888] chalk-text">Cliente não encontrado.</p>
        <button onClick={() => router.back()} className="text-[#f0c040] hover:underline chalk-text">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="chalkboard min-h-screen p-6">
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </button>
          <h1 className="chalk-title text-2xl text-[#e8e8e8] flex-1">{client.name}</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#f0c040]/10 border border-[#f0c040]/30 text-[#f0c040] rounded-xl hover:bg-[#f0c040]/20 transition-colors chalk-text text-sm"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        </div>

        {/* Info card */}
        <div className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl p-5 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {stageName && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666] uppercase tracking-wider">Etapa</span>
              <span className="ml-2 px-2.5 py-0.5 bg-[#f0c040]/10 text-[#f0c040] rounded-full text-xs chalk-text">
                {stageName}
              </span>
            </div>
          )}
          {client.contract_value != null && client.contract_value > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#22c55e]" />
              <span className="chalk-text text-[#22c55e] font-semibold">
                {formatCurrency(client.contract_value)}
              </span>
            </div>
          )}
          {client.contact_name && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#888]" />
              <span className="chalk-text text-[#ccc] text-sm">{client.contact_name}</span>
            </div>
          )}
          {client.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#888]" />
              <a
                href={`mailto:${client.contact_email}`}
                className="chalk-text text-[#60a5fa] text-sm hover:underline"
              >
                {client.contact_email}
              </a>
            </div>
          )}
          {client.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#888]" />
              <span className="chalk-text text-[#ccc] text-sm">{client.contact_phone}</span>
            </div>
          )}
          {client.start_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#888]" />
              <span className="chalk-text text-[#ccc] text-sm">
                Início: {format(parseISO(client.start_date), "dd/MM/yyyy")}
              </span>
            </div>
          )}
          {client.expected_end_date && (
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#888]" />
              <span className="chalk-text text-[#ccc] text-sm">
                Previsão: {format(parseISO(client.expected_end_date), "dd/MM/yyyy")}
              </span>
            </div>
          )}
          {client.notes && (
            <div className="col-span-2 flex items-start gap-2 pt-2 border-t border-[#3a3a4a]">
              <StickyNote className="w-4 h-4 text-[#888] mt-0.5" />
              <p className="chalk-text text-[#aaa] text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Events */}
        <div>
          <h2 className="chalk-title text-lg text-[#e8e8e8] mb-3">
            Eventos vinculados ({events.length})
          </h2>
          {events.length === 0 ? (
            <div className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl p-6 text-center text-[#666] chalk-text">
              Nenhum evento vinculado a este cliente.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-xl p-4 flex items-center gap-3"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ev.color || "#f0c040" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="chalk-text text-[#e8e8e8] text-sm font-medium truncate">
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#666]" />
                      <span className="text-xs text-[#666]">
                        {format(parseISO(ev.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ClientModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        client={client}
        stages={stages}
        userId={user?.id || ""}
      />
    </div>
  );
}
