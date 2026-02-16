"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event } from "@/types/database";
import { Bot, X, Send, Clock, Calendar, CheckSquare, AlertCircle, MessageCircle, ChevronRight } from "lucide-react";
import {
  format, isToday, isThisWeek, isThisMonth, isBefore,
  parseISO, addHours, startOfDay, endOfDay, addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

type PanelTab = "agenda" | "chat";
type ViewFilter = "today" | "week" | "month";

interface ChatMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  events?: Event[];
  tasks?: TaskItem[];
}

interface TaskItem {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
}

const SUGGESTIONS = [
  "O que tenho hoje?",
  "Compromissos da semana",
  "Proximo evento",
  "Tarefas pendentes",
  "Adicionar evento",
  "Adicionar tarefa",
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  meeting: "Reuniao",
  deadline: "Prazo",
};

export default function RobotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>("agenda");
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [hasUpcoming, setHasUpcoming] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<ViewFilter>("today");

  // Creation wizard state
  const [wizardStep, setWizardStep] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<Record<string, string>>({});

  const alertedRef = useRef<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const supabase = createClient();

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat tab opens
  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) {
        addBotMessage("Ola! Sou seu assistente. Pergunte sobre seus compromissos ou me peca para adicionar algo na sua agenda!");
      }
    }
  }, [isOpen, activeTab]);

  // --- Data fetching ---
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const { data } = await supabase
      .from("events").select("*").eq("user_id", user.id)
      .gte("start_time", start.toISOString()).lte("start_time", end.toISOString())
      .order("start_time", { ascending: true });
    if (data) setEvents(data as Event[]);
  }, [user, supabase]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tasks").select("id, title, due_date, priority")
      .eq("user_id", user.id).eq("completed", false)
      .order("created_at", { ascending: false }).limit(20);
    if (data) setTasks(data);
  }, [user, supabase]);

  useEffect(() => { fetchEvents(); fetchTasks(); }, [fetchEvents, fetchTasks]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("robot-assistant")
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `user_id=eq.${user.id}` }, () => fetchEvents())
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchEvents, fetchTasks]);

  // Alert system
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      let hasNearby = false;
      events.forEach((event) => {
        const eventTime = parseISO(event.start_time);
        if (isBefore(eventTime, now)) return;
        const diffMin = Math.floor((eventTime.getTime() - now.getTime()) / 60000);
        [30, 15, 5].forEach((threshold) => {
          const key = `${event.id}-${threshold}`;
          if (diffMin <= threshold && diffMin > (threshold === 5 ? 0 : threshold - 10) && !alertedRef.current.has(key)) {
            alertedRef.current.add(key);
            toast(`${event.title} em ${diffMin} min (${format(eventTime, "HH:mm")})`, {
              icon: "🤖", duration: 8000,
              style: { background: "#2a2a3a", color: "#f0c040", border: "1px solid #f0c040", fontFamily: "'Caveat', cursive", fontSize: "16px" },
            });
          }
        });
        if (diffMin <= 60) hasNearby = true;
      });
      setHasUpcoming(hasNearby);
    };
    checkUpcoming();
    const interval = setInterval(checkUpcoming, 60000);
    return () => clearInterval(interval);
  }, [events]);

  const todayCount = events.filter((e) => isToday(parseISO(e.start_time))).length;
  const pendingTaskCount = tasks.length;

  // --- Agenda tab: filtered events ---
  const filteredEvents = events.filter((event) => {
    const date = parseISO(event.start_time);
    switch (filter) {
      case "today": return isToday(date);
      case "week": return isThisWeek(date, { locale: ptBR });
      case "month": return isThisMonth(date);
    }
  });

  const groupedEvents = filteredEvents.reduce<Record<string, Event[]>>((acc, event) => {
    const dateKey = format(parseISO(event.start_time), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  // --- Chat helpers ---
  const addBotMessage = (text: string, extra?: Partial<ChatMessage>) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), from: "bot", text, ...extra }]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), from: "user", text }]);
  };

  // --- Process message ---
  const processMessage = async (text: string) => {
    const msg = text.toLowerCase().trim();

    if (wizardStep) {
      await handleWizard(text);
      return;
    }

    if (match(msg, ["hoje", "dia", "o que tenho"])) {
      const todayEvents = events.filter((e) => isToday(parseISO(e.start_time)));
      const todayTasks = tasks.slice(0, 5);
      if (todayEvents.length === 0 && todayTasks.length === 0) {
        addBotMessage("Voce nao tem compromissos nem tarefas para hoje. Dia livre! 🎉");
      } else {
        let response = "";
        if (todayEvents.length > 0) response += `Voce tem ${todayEvents.length} evento${todayEvents.length > 1 ? "s" : ""} hoje:`;
        if (todayTasks.length > 0) response += response ? "\n\nE tarefas pendentes:" : "Tarefas pendentes para hoje:";
        addBotMessage(response, { events: todayEvents, tasks: todayTasks.length > 0 ? todayTasks : undefined });
      }
      return;
    }

    if (match(msg, ["semana", "semanal"])) {
      const weekEvents = events.filter((e) => isThisWeek(parseISO(e.start_time), { locale: ptBR }));
      if (weekEvents.length === 0) addBotMessage("Nenhum compromisso para esta semana.");
      else addBotMessage(`Voce tem ${weekEvents.length} evento${weekEvents.length > 1 ? "s" : ""} esta semana:`, { events: weekEvents });
      return;
    }

    if (match(msg, ["mes", "mensal", "mês"])) {
      const monthEvents = events.filter((e) => isThisMonth(parseISO(e.start_time)));
      if (monthEvents.length === 0) addBotMessage("Nenhum compromisso para este mes.");
      else addBotMessage(`Voce tem ${monthEvents.length} evento${monthEvents.length > 1 ? "s" : ""} este mes:`, { events: monthEvents });
      return;
    }

    if (match(msg, ["proximo", "próximo", "next"])) {
      const now = new Date();
      const next = events.find((e) => !isBefore(parseISO(e.start_time), now));
      if (next) {
        const dt = parseISO(next.start_time);
        addBotMessage(`Proximo compromisso: "${next.title}" em ${format(dt, "dd/MM 'as' HH:mm", { locale: ptBR })}`, { events: [next] });
      } else addBotMessage("Nenhum proximo evento encontrado este mes.");
      return;
    }

    if (match(msg, ["tarefa", "tarefas", "pendente", "pendentes", "to do", "todo"])) {
      if (tasks.length === 0) addBotMessage("Voce nao tem tarefas pendentes. Tudo em dia! ✅");
      else addBotMessage(`Voce tem ${tasks.length} tarefa${tasks.length > 1 ? "s" : ""} pendente${tasks.length > 1 ? "s" : ""}:`, { tasks });
      return;
    }

    if (match(msg, ["adicionar evento", "criar evento", "novo evento", "agendar", "marcar"])) {
      setWizardStep("event_title");
      setWizardData({});
      addBotMessage("Vamos criar um evento! Qual o titulo?");
      return;
    }

    if (match(msg, ["adicionar tarefa", "criar tarefa", "nova tarefa"])) {
      setWizardStep("task_title");
      setWizardData({});
      addBotMessage("Vamos criar uma tarefa! Qual o titulo?");
      return;
    }

    if (match(msg, ["ajuda", "help", "comandos", "o que voce faz"])) {
      addBotMessage(
        "Posso te ajudar com:\n\n" +
        "📅 \"O que tenho hoje?\" - compromissos do dia\n" +
        "📅 \"Compromissos da semana\" - eventos da semana\n" +
        "📅 \"Compromissos do mes\" - eventos do mes\n" +
        "⏭️ \"Proximo evento\" - proximo compromisso\n" +
        "✅ \"Tarefas pendentes\" - lista de tarefas\n" +
        "➕ \"Adicionar evento\" - criar novo evento\n" +
        "➕ \"Adicionar tarefa\" - criar nova tarefa"
      );
      return;
    }

    addBotMessage("Nao entendi. Tente perguntar sobre seus compromissos (hoje, semana, mes) ou peca para adicionar um evento ou tarefa. Digite \"ajuda\" para ver os comandos.");
  };

  // --- Wizard ---
  const handleWizard = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.toLowerCase() === "cancelar" || trimmed.toLowerCase() === "sair") {
      setWizardStep(null); setWizardData({});
      addBotMessage("Cancelado!");
      return;
    }

    if (wizardStep === "event_title") {
      setWizardData((prev) => ({ ...prev, title: trimmed }));
      setWizardStep("event_date");
      addBotMessage(`Titulo: "${trimmed}". Qual a data? (ex: 20/02/2026 ou "hoje" ou "amanha")`);
      return;
    }
    if (wizardStep === "event_date") {
      const parsedDate = parseUserDate(trimmed);
      if (!parsedDate) { addBotMessage("Nao entendi a data. Use DD/MM/AAAA, ou \"hoje\" ou \"amanha\"."); return; }
      setWizardData((prev) => ({ ...prev, date: parsedDate }));
      setWizardStep("event_time");
      addBotMessage(`Data: ${format(new Date(parsedDate), "dd/MM/yyyy")}. Qual o horario de inicio? (ex: 14:00)`);
      return;
    }
    if (wizardStep === "event_time") {
      const timeMatch = trimmed.match(/^(\d{1,2})[:\.](\d{2})$/);
      if (!timeMatch) { addBotMessage("Formato invalido. Use HH:MM (ex: 14:00, 9:30)."); return; }
      const hours = timeMatch[1].padStart(2, "0");
      const mins = timeMatch[2];
      setWizardData((prev) => ({ ...prev, time: `${hours}:${mins}` }));
      setWizardStep("event_duration");
      addBotMessage(`Horario: ${hours}:${mins}. Duracao em horas? (ex: 1, 0.5, 2) ou "dia inteiro"`);
      return;
    }
    if (wizardStep === "event_duration") {
      if (!user) return;
      const allDay = match(trimmed.toLowerCase(), ["dia inteiro", "o dia todo", "all day"]);
      const dateStr = wizardData.date!;
      let startTime: Date; let endTime: Date;
      if (allDay) {
        startTime = startOfDay(new Date(dateStr));
        endTime = endOfDay(new Date(dateStr));
      } else {
        const dur = parseFloat(trimmed);
        if (isNaN(dur) || dur <= 0) { addBotMessage("Duracao invalida. Digite um numero (ex: 1, 0.5) ou \"dia inteiro\"."); return; }
        const [h, m] = wizardData.time!.split(":").map(Number);
        startTime = new Date(dateStr); startTime.setHours(h, m, 0, 0);
        endTime = addHours(startTime, dur);
      }
      const { error } = await supabase.from("events").insert({
        user_id: user.id, title: wizardData.title!, start_time: startTime.toISOString(), end_time: endTime.toISOString(), all_day: allDay, color: "#f0c040",
      });
      setWizardStep(null); setWizardData({});
      if (error) addBotMessage("Erro ao criar o evento. Tente novamente.");
      else { await fetchEvents(); addBotMessage(`Evento "${wizardData.title}" criado com sucesso! ✅\n📅 ${format(startTime, "dd/MM/yyyy")} ${allDay ? "(dia inteiro)" : `das ${format(startTime, "HH:mm")} as ${format(endTime, "HH:mm")}`}`); }
      return;
    }
    if (wizardStep === "task_title") {
      setWizardData((prev) => ({ ...prev, title: trimmed }));
      setWizardStep("task_priority");
      addBotMessage(`Titulo: "${trimmed}". Qual a prioridade? (alta, media, baixa)`);
      return;
    }
    if (wizardStep === "task_priority") {
      if (!user) return;
      let priority: "low" | "medium" | "high" = "medium";
      if (match(trimmed.toLowerCase(), ["alta", "high", "urgente"])) priority = "high";
      else if (match(trimmed.toLowerCase(), ["baixa", "low"])) priority = "low";
      const { error } = await supabase.from("tasks").insert({ user_id: user.id, title: wizardData.title!, priority });
      setWizardStep(null); setWizardData({});
      if (error) addBotMessage("Erro ao criar a tarefa. Tente novamente.");
      else { await fetchTasks(); const prioLabel = priority === "high" ? "Alta" : priority === "low" ? "Baixa" : "Media"; addBotMessage(`Tarefa "${wizardData.title}" criada com sucesso! ✅\nPrioridade: ${prioLabel}`); }
      return;
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addUserMessage(text);
    setInput("");
    setTimeout(() => processMessage(text), 300);
  };

  const filterLabels: Record<ViewFilter, string> = { today: "Hoje", week: "Semana", month: "Mes" };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? "bg-[#3a3a4a] scale-90"
            : hasUpcoming ? "bg-[#f0c040] animate-pulse shadow-[0_0_20px_rgba(240,192,64,0.4)]"
            : "bg-[#2a2a3a] border border-[#3a3a4a] hover:bg-[#3a3a4a] hover:scale-105"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#e8e8e8]" />
        ) : (
          <>
            <Bot className={`w-7 h-7 ${hasUpcoming ? "text-[#1e1e2e]" : "text-[#f0c040]"}`} />
            {todayCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {todayCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] h-[500px] bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#3a3a4a] bg-[#232335] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#f0c040]" />
              <span className="chalk-text text-lg text-[#e8e8e8] font-bold">Assistente Plannerly</span>
            </div>
            <p className="chalk-text text-xs text-[#888] mt-0.5">
              {todayCount > 0
                ? `${todayCount} compromisso${todayCount > 1 ? "s" : ""} hoje`
                : "Nenhum compromisso hoje"}
              {pendingTaskCount > 0 && ` · ${pendingTaskCount} tarefa${pendingTaskCount > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-[#3a3a4a] flex-shrink-0">
            <button
              onClick={() => setActiveTab("agenda")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 chalk-text text-sm transition-all ${
                activeTab === "agenda"
                  ? "text-[#f0c040] border-b-2 border-[#f0c040] bg-[#f0c040]/5"
                  : "text-[#666] hover:text-[#888]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Agenda
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 chalk-text text-sm transition-all ${
                activeTab === "chat"
                  ? "text-[#f0c040] border-b-2 border-[#f0c040] bg-[#f0c040]/5"
                  : "text-[#666] hover:text-[#888]"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>

          {/* ===== AGENDA TAB ===== */}
          {activeTab === "agenda" && (
            <>
              {/* Filter buttons */}
              <div className="flex gap-1 px-3 py-2 border-b border-[#3a3a4a] flex-shrink-0">
                {(["today", "week", "month"] as ViewFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 py-1.5 rounded-lg chalk-text text-sm transition-all ${
                      filter === f
                        ? "bg-[#f0c040]/15 text-[#f0c040] border border-[#f0c040]/30"
                        : "text-[#888] hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {filterLabels[f]}
                  </button>
                ))}
              </div>

              {/* Events list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="w-10 h-10 text-[#3a3a4a] mb-3" />
                    <p className="chalk-text text-sm text-[#666]">
                      Nenhum compromisso {filter === "today" ? "para hoje" : filter === "week" ? "esta semana" : "este mes"}
                    </p>
                  </div>
                ) : filter === "today" ? (
                  filteredEvents.map((ev) => <AgendaEventItem key={ev.id} event={ev} showDate={false} />)
                ) : (
                  Object.entries(groupedEvents)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, dayEvents]) => (
                      <div key={dateKey}>
                        <div className="chalk-text text-xs text-[#f0c040] uppercase tracking-wider mb-1 mt-3 first:mt-0">
                          {format(parseISO(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        {dayEvents.map((ev) => <AgendaEventItem key={ev.id} event={ev} showDate={false} />)}
                      </div>
                    ))
                )}

                {/* Pending tasks */}
                {filter === "today" && pendingTaskCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#3a3a4a]">
                    <div className="chalk-text text-xs text-[#888] uppercase tracking-wider mb-2">
                      Tarefas Pendentes
                    </div>
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-start gap-2 py-1">
                        <ChevronRight className="w-3 h-3 text-[#555] mt-0.5 flex-shrink-0" />
                        <span className="chalk-text text-sm text-[#a0a0b0] leading-tight">{task.title}</span>
                        {task.priority === "high" && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />}
                      </div>
                    ))}
                    {pendingTaskCount > 5 && (
                      <p className="chalk-text text-xs text-[#555] mt-1">+{pendingTaskCount - 5} tarefa{pendingTaskCount - 5 > 1 ? "s" : ""}...</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== CHAT TAB ===== */}
          {activeTab === "chat" && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-xl chalk-text text-sm whitespace-pre-line ${
                          msg.from === "user"
                            ? "bg-[#f0c040]/15 text-[#f0c040] rounded-br-sm"
                            : "bg-[#1e1e2e] text-[#e8e8e8] border border-[#3a3a4a] rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>

                    {msg.events && msg.events.length > 0 && (
                      <div className="mt-2 space-y-1 ml-1">
                        {msg.events.map((ev) => {
                          const start = parseISO(ev.start_time);
                          const end = parseISO(ev.end_time);
                          return (
                            <div key={ev.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-[#1e1e2e]/50">
                              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: ev.color || "#f0c040" }} />
                              <div className="min-w-0">
                                <p className="chalk-text text-xs text-[#e8e8e8] leading-tight">{ev.title}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5 text-[#555]" />
                                  <span className="chalk-text text-[10px] text-[#888]">
                                    {ev.all_day ? "Dia inteiro" : `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`}
                                    {!isToday(start) && ` (${format(start, "dd/MM")})`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {msg.tasks && msg.tasks.length > 0 && (
                      <div className="mt-2 space-y-1 ml-1">
                        {msg.tasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#1e1e2e]/50">
                            <CheckSquare className="w-3 h-3 text-[#f0c040] flex-shrink-0" />
                            <span className="chalk-text text-xs text-[#e8e8e8]">{t.title}</span>
                            {t.priority === "high" && <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              {!wizardStep && messages.length <= 2 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { addUserMessage(s); setTimeout(() => processMessage(s), 300); }}
                      className="px-2.5 py-1 bg-[#1e1e2e] border border-[#3a3a4a] rounded-full chalk-text text-[11px] text-[#888] hover:text-[#f0c040] hover:border-[#f0c040]/30 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {wizardStep && (
                <div className="px-3 pb-1 flex-shrink-0">
                  <span className="chalk-text text-[10px] text-[#555]">Digite &quot;cancelar&quot; para sair</span>
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-[#3a3a4a] flex items-center gap-2 flex-shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={wizardStep ? "Digite sua resposta..." : "Pergunte algo..."}
                  className="flex-1 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl px-3 py-2 text-sm text-[#e8e8e8] placeholder-[#555] chalk-text outline-none focus:border-[#f0c040]/40"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 text-[#f0c040] hover:bg-[#f0c040]/10 rounded-xl transition-colors disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// --- Sub-components ---

function AgendaEventItem({ event, showDate }: { event: Event; showDate: boolean }) {
  const startTime = parseISO(event.start_time);
  const endTime = parseISO(event.end_time);
  const now = new Date();
  const isPast = isBefore(endTime, now);
  const eventType = (event as Event & { event_type?: string }).event_type;

  return (
    <div className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${isPast ? "opacity-50" : "hover:bg-white/5"}`}>
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: event.color || "#f0c040" }} />
      <div className="flex-1 min-w-0">
        <p className={`chalk-text text-sm leading-tight ${isPast ? "text-[#666]" : "text-[#e8e8e8]"}`}>{event.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="w-3 h-3 text-[#555]" />
          <span className="chalk-text text-xs text-[#888]">
            {event.all_day ? "Dia inteiro" : `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`}
          </span>
          {eventType && eventType !== "event" && (
            <span className="chalk-text text-[10px] text-[#666] bg-[#1e1e2e] px-1.5 py-0.5 rounded">
              {EVENT_TYPE_LABELS[eventType] || eventType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Utility functions ---

function match(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

function parseUserDate(text: string): string | null {
  const lower = text.toLowerCase().trim();
  const now = new Date();
  if (lower === "hoje") return now.toISOString().split("T")[0];
  if (lower === "amanha" || lower === "amanhã") return addDays(now, 1).toISOString().split("T")[0];
  const brMatch = lower.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }
  const shortMatch = lower.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (shortMatch) {
    const [, d, m] = shortMatch;
    const date = new Date(now.getFullYear(), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
  }
  return null;
}
