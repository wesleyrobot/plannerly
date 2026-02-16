"use client";

import { useMemo } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/contexts/AuthContext";
import { EventInsert } from "@/types/database";
import EventModal from "./EventModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

interface ChalkboardCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onSwitchToDay?: (date: Date) => void;
}

export default function ChalkboardCalendar({ currentDate, onDateChange, onSwitchToDay }: ChalkboardCalendarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<import("@/types/database").Event | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const { user } = useAuth();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { events, saveEvent, deleteEvent } = useCalendarEvents({ startDate: calStart, endDate: calEnd });

  const days = useMemo(() => {
    const result: Date[] = [];
    let day = calStart;
    while (day <= calEnd) { result.push(day); day = addDays(day, 1); }
    return result;
  }, [calStart.toISOString(), calEnd.toISOString()]);

  const getEventsForDay = (date: Date) => events.filter((e) => isSameDay(parseISO(e.start_time), date));

  const handleSave = async (eventData: EventInsert) => {
    await saveEvent(eventData, selectedEvent?.id);
  };

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
  };

  const monthLabel = format(currentDate, "MMMM", { locale: ptBR }).toUpperCase();
  const yearLabel = format(currentDate, "yyyy");

  return (
    <div className="relative z-10">
      <div className="flex items-center justify-center gap-6 mb-6">
        <button onClick={() => onDateChange(subMonths(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#888]" />
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="chalk-text text-xl text-[#f0c040]">{monthLabel}</span>
            <span className="chalk-text text-lg text-[#888]">{yearLabel}</span>
          </div>
        </div>
        <button onClick={() => onDateChange(addMonths(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-[#888]" />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="calendar-header-cell">{wd}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {days.map((d, i) => {
          const dayEvents = getEventsForDay(d);
          const inMonth = isSameMonth(d, currentDate);
          const isCurrentDay = isToday(d);
          const dateStr = format(d, "yyyy-MM-dd");

          return (
            <div
              key={i}
              className={`calendar-cell ${isCurrentDay ? "today" : ""}`}
              onClick={() => { setSelectedEvent(null); setSelectedDate(dateStr); setModalOpen(true); }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`chalk-text text-sm cursor-pointer hover:underline ${
                    !inMonth ? "text-[#444]" : isCurrentDay ? "text-[#f0c040] font-bold" : "text-[#999]"
                  }`}
                  onClick={(e) => {
                    if (onSwitchToDay) { e.stopPropagation(); onSwitchToDay(d); }
                  }}
                >
                  {format(d, "d")}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    className="event-tag text-[#e8e8e8]"
                    style={{ backgroundColor: evt.color + "40" }}
                    onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); setSelectedDate(""); setModalOpen(true); }}
                  >
                    {evt.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <span className="chalk-text text-xs text-[#888]">+{dayEvents.length - 3} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEvent(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        event={selectedEvent}
        selectedDate={selectedDate}
        userId={user?.id || ""}
      />
    </div>
  );
}
