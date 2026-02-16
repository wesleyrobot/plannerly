"use client";

import { useState, useEffect, useRef } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/contexts/AuthContext";
import { EventInsert } from "@/types/database";
import EventModal from "./EventModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, isToday, parseISO, getHours, getMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 60;
const WEEKDAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

interface WeeklyViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function WeeklyView({ currentDate, onDateChange }: WeeklyViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<import("@/types/database").Event | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const { events, saveEvent, deleteEvent } = useCalendarEvents({ startDate: weekStart, endDate: weekEnd });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      const now = new Date();
      const scrollTo = (getHours(now) - START_HOUR) * HOUR_HEIGHT - 100;
      gridRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, []);

  const getEventsForDay = (date: Date) =>
    events.filter((e) => isSameDay(parseISO(e.start_time), date) && !e.all_day);

  const getAllDayEvents = (date: Date) =>
    events.filter((e) => isSameDay(parseISO(e.start_time), date) && e.all_day);

  const getEventPosition = (event: import("@/types/database").Event) => {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startMin = getHours(start) * 60 + getMinutes(start);
    const endMin = getHours(end) * 60 + getMinutes(end);
    const top = (startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60);
    const height = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 24);
    return { top, height };
  };

  const getCurrentTimePosition = () => {
    const min = getHours(currentTime) * 60 + getMinutes(currentTime);
    return (min - START_HOUR * 60) * (HOUR_HEIGHT / 60);
  };

  const handleSave = async (eventData: EventInsert) => {
    await saveEvent(eventData, selectedEvent?.id);
  };

  const handleCellClick = (date: Date, hour: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const hourStr = hour.toString().padStart(2, "0");
    setSelectedEvent(null);
    setSelectedDate(`${dateStr}T${hourStr}:00`);
    setModalOpen(true);
  };

  const weekLabel = `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`;

  return (
    <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <button onClick={() => onDateChange(subWeeks(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#888]" />
        </button>
        <div className="text-center">
          <div className="chalk-text text-lg text-[#f0c040]">{weekLabel.toUpperCase()}</div>
        </div>
        <button onClick={() => onDateChange(addWeeks(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-[#888]" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#3a3a4a]">
        <div className="p-2" />
        {weekDays.map((d, i) => {
          const today = isToday(d);
          return (
            <div key={i} className={`text-center py-2 border-l border-[#3a3a4a] ${today ? "bg-[#f0c040]/8" : ""}`}>
              <div className="chalk-text text-xs text-[#888] tracking-wider">{WEEKDAYS_SHORT[i]}</div>
              <div className={`chalk-text text-lg ${today ? "text-[#f0c040] font-bold" : "text-[#a0a0b0]"}`}>
                {format(d, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      {weekDays.some((d) => getAllDayEvents(d).length > 0) && (
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#3a3a4a]">
          <div className="p-1 text-right pr-2">
            <span className="chalk-text text-xs text-[#666]">Dia todo</span>
          </div>
          {weekDays.map((d, i) => (
            <div key={i} className="border-l border-[#3a3a4a] p-1 space-y-0.5">
              {getAllDayEvents(d).map((evt) => (
                <div
                  key={evt.id}
                  className="event-tag text-[#e8e8e8] text-xs cursor-pointer"
                  style={{ backgroundColor: evt.color + "40" }}
                  onClick={() => { setSelectedEvent(evt); setSelectedDate(""); setModalOpen(true); }}
                >
                  {evt.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Time labels */}
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="border-b border-[#3a3a4a]/50 flex items-start justify-end pr-2 pt-0.5" style={{ height: HOUR_HEIGHT }}>
                <span className="chalk-text text-xs text-[#666]">{`${h.toString().padStart(2, "0")}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((d, dayIdx) => {
            const dayEvents = getEventsForDay(d);
            const today = isToday(d);

            return (
              <div key={dayIdx} className={`relative border-l border-[#3a3a4a] ${today ? "bg-[#f0c040]/5" : ""}`}>
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="border-b border-[#3a3a4a]/30 cursor-pointer hover:bg-white/3"
                    style={{ height: HOUR_HEIGHT }}
                    onClick={() => handleCellClick(d, h)}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((evt) => {
                  const { top, height } = getEventPosition(evt);
                  return (
                    <div
                      key={evt.id}
                      className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 cursor-pointer overflow-hidden border-l-3 z-10"
                      style={{
                        top, height,
                        backgroundColor: evt.color + "30",
                        borderLeftColor: evt.color,
                        borderLeftWidth: "3px",
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); setSelectedDate(""); setModalOpen(true); }}
                    >
                      <div className="chalk-text text-xs text-[#e8e8e8] font-semibold truncate">{evt.title}</div>
                      <div className="chalk-text text-[10px] text-[#a0a0b0]">
                        {format(parseISO(evt.start_time), "HH:mm")} - {format(parseISO(evt.end_time), "HH:mm")}
                      </div>
                    </div>
                  );
                })}

                {/* Current time line */}
                {today && getHours(currentTime) >= START_HOUR && getHours(currentTime) < END_HOUR && (
                  <div className="current-time-line" style={{ top: getCurrentTimePosition() }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEvent(null); }}
        onSave={handleSave}
        onDelete={deleteEvent}
        event={selectedEvent}
        selectedDate={selectedDate}
        userId={user?.id || ""}
      />
    </div>
  );
}
