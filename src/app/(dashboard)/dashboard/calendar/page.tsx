"use client";

import { useState, useMemo } from "react";
import ChalkboardCalendar from "@/components/calendar/ChalkboardCalendar";
import WeeklyView from "@/components/calendar/WeeklyView";
import DailyView from "@/components/calendar/DailyView";
import ViewSwitcher, { CalendarViewType } from "@/components/calendar/ViewSwitcher";
import ExportMenu from "@/components/calendar/ExportMenu";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, format,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarPage() {
  const [view, setView] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => {
    if (view === "month") {
      const ms = startOfMonth(currentDate);
      const me = endOfMonth(currentDate);
      return {
        startDate: startOfWeek(ms, { weekStartsOn: 0 }),
        endDate: endOfWeek(me, { weekStartsOn: 0 }),
      };
    }
    if (view === "week") {
      return {
        startDate: startOfWeek(currentDate, { weekStartsOn: 0 }),
        endDate: endOfWeek(currentDate, { weekStartsOn: 0 }),
      };
    }
    return { startDate: startOfDay(currentDate), endDate: endOfDay(currentDate) };
  }, [view, currentDate]);

  const { events } = useCalendarEvents({ startDate, endDate });

  const periodLabel = useMemo(() => {
    if (view === "month") return format(currentDate, "MMMM-yyyy", { locale: ptBR });
    if (view === "week") return `semana-${format(startDate, "dd-MM-yyyy", { locale: ptBR })}`;
    return format(currentDate, "dd-MM-yyyy", { locale: ptBR });
  }, [view, currentDate, startDate]);

  const viewTitle = view === "month" ? "MENSAL" : view === "week" ? "SEMANAL" : "DIÁRIO";

  return (
    <div className="chalkboard min-h-screen p-6">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="chalk-title text-2xl text-[#e8e8e8] tracking-widest">{viewTitle}</h2>
          <div className="flex items-center gap-3">
            <ExportMenu events={events} periodLabel={periodLabel} />
            <button
              onClick={() => setCurrentDate(new Date())}
              className="chalk-text text-sm px-3 py-1 border border-[#3a3a4a] rounded-lg text-[#a0a0b0] hover:bg-white/5 transition-colors"
            >
              Hoje
            </button>
            <ViewSwitcher currentView={view} onViewChange={setView} />
          </div>
        </div>

        {view === "month" && (
          <ChalkboardCalendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSwitchToDay={(date) => { setCurrentDate(date); setView("day"); }}
          />
        )}
        {view === "week" && (
          <WeeklyView currentDate={currentDate} onDateChange={setCurrentDate} />
        )}
        {view === "day" && (
          <DailyView currentDate={currentDate} onDateChange={setCurrentDate} />
        )}
      </div>
    </div>
  );
}
