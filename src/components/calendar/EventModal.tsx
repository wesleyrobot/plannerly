"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2, CalendarDays, Users, Clock } from "lucide-react";
import { Event, EventInsert, Client } from "@/types/database";
import { createClient } from "@/lib/supabase";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventInsert) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  event?: Event | null;
  selectedDate?: string;
  userId: string;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
];

const EVENT_TYPES = [
  { key: "event" as const, label: "Evento", icon: CalendarDays },
  { key: "meeting" as const, label: "Reunião", icon: Users },
  { key: "deadline" as const, label: "Prazo", icon: Clock },
];

export default function EventModal({
  isOpen, onClose, onSave, onDelete, event, selectedDate, userId,
}: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [allDay, setAllDay] = useState(false);
  const [eventType, setEventType] = useState<"event" | "meeting" | "deadline">("event");
  const [clientId, setClientId] = useState<string>("");
  const [clients, setClients] = useState<Client[]>([]);
  const [recurrence, setRecurrence] = useState<"" | "daily" | "weekly" | "monthly">("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const supabase = createClient();

  // Fetch clients for dropdown
  useEffect(() => {
    if (!isOpen || !userId) return;
    const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      if (data) setClients(data);
    };
    fetchClients();
  }, [isOpen, userId, supabase]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartTime(event.start_time.slice(0, 16));
      setEndTime(event.end_time.slice(0, 16));
      setColor(event.color);
      setAllDay(event.all_day);
      setEventType(event.event_type || "event");
      setClientId(event.client_id || "");
      setRecurrence((event.recurrence as "" | "daily" | "weekly" | "monthly") || "");
      setRecurrenceEnd(event.recurrence_end || "");
    } else if (selectedDate) {
      setTitle("");
      setDescription("");
      const dateOnly = selectedDate.includes("T") ? selectedDate : `${selectedDate}T09:00`;
      setStartTime(dateOnly);
      // Add 1 hour for end time
      const [datePart, timePart] = dateOnly.split("T");
      if (timePart) {
        const [h, m] = timePart.split(":");
        const endH = (parseInt(h) + 1).toString().padStart(2, "0");
        setEndTime(`${datePart}T${endH}:${m}`);
      } else {
        setEndTime(`${dateOnly}T10:00`);
      }
      setColor(COLORS[0]);
      setAllDay(false);
      setEventType("event");
      setClientId("");
      setRecurrence("");
      setRecurrenceEnd("");
    }
  }, [event, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...(event?.id ? { id: event.id } : {}),
        user_id: userId,
        title,
        description: description || null,
        start_time: allDay ? `${startTime.split("T")[0]}T00:00:00` : startTime,
        end_time: allDay ? `${endTime.split("T")[0]}T23:59:59` : endTime,
        color,
        all_day: allDay,
        event_type: eventType,
        client_id: clientId || null,
        recurrence: recurrence || null,
        recurrence_end: recurrenceEnd || null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(event.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="chalk-title text-xl text-[#e8e8e8]">
            {event ? "Editar Evento" : "Novo Evento"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#888]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Type Selector */}
          <div>
            <label className="block text-sm text-[#888] mb-2">Tipo</label>
            <div className="flex gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setEventType(t.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl chalk-text text-sm transition-all ${
                    eventType === t.key
                      ? "bg-[#f0c040]/15 text-[#f0c040] border border-[#f0c040]/30"
                      : "text-[#888] border border-[#3a3a4a] hover:bg-white/5"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 focus:border-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555] chalk-text text-lg"
              placeholder={eventType === "meeting" ? "Nome da reunião" : eventType === "deadline" ? "Prazo para..." : "Nome do evento"}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 focus:border-[#f0c040]/50 outline-none resize-none text-[#e8e8e8] placeholder-[#555] chalk-text text-lg"
              placeholder="Detalhes (opcional)"
              rows={3}
            />
          </div>

          {/* Client selector */}
          {clients.length > 0 && (
            <div>
              <label className="block text-sm text-[#888] mb-1">Cliente (opcional)</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] chalk-text"
              >
                <option value="">Nenhum cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded bg-[#1e1e2e] border-[#3a3a4a]"
            />
            <label htmlFor="allDay" className="text-sm text-[#a0a0b0]">
              Dia inteiro
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#888] mb-1">Início</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? startTime.split("T")[0] : startTime}
                onChange={(e) => setStartTime(allDay ? `${e.target.value}T09:00` : e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-1">Fim</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? endTime.split("T")[0] : endTime}
                onChange={(e) => setEndTime(allDay ? `${e.target.value}T10:00` : e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8]"
                required
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm text-[#888] mb-1">Repetir</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as "" | "daily" | "weekly" | "monthly")}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] chalk-text"
            >
              <option value="">Não repetir</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </select>
          </div>

          {recurrence && (
            <div>
              <label className="block text-sm text-[#888] mb-1">Repetir até</label>
              <input
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-[#888] mb-2">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-offset-[#2a2a3a] ring-[#f0c040] scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#3a3a4a]">
            {event && onDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-[#3a3a4a] rounded-xl text-[#a0a0b0] hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {event ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      isOpen={confirmDelete}
      title="Excluir evento"
      message={`Tem certeza que deseja excluir "${event?.title}"? Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
    />
    </>
  );
}
