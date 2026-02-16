"use client";

import { useState, useEffect, useRef } from "react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/contexts/AuthContext";
import { EventInsert } from "@/types/database";
import EventModal from "./EventModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format, startOfDay, endOfDay, addDays, subDays,
  isToday, parseISO, getHours, getMinutes,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const START_HOUR = 6;
const END_HOUR = 22;
const HOUR_HEIGHT = 72;

interface DailyViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DailyView({ currentDate, onDateChange }: DailyViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<import("@/types/database").Event | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);
  const { events, saveEvent, deleteEvent } = useCalendarEvents({ startDate: dayStart, endDate: dayEnd });

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const halfHours = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => START_HOUR + i * 0.5);

  const dayEvents = events.filter((e) => !e.all_day);
  const allDayEvents = events.filter((e) => e.all_day);
  const today = isToday(currentDate);

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

  const getEventPosition = (event: import("@/types/database").Event) => {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startMin = getHours(start) * 60 + getMinutes(start);
    const endMin = getHours(end) * 60 + getMinutes(end);
    const top = (startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60);
    const height = Math.max((endMin - startMin) * (HOUR_HEIGHT / 60), 30);
    return { top, height };
  };

  const getCurrentTimePosition = () => {
    const min = getHours(currentTime) * 60 + getMinutes(currentTime);
    return (min - START_HOUR * 60) * (HOUR_HEIGHT / 60);
  };

  const handleSave = async (eventData: EventInsert) => {
    await saveEvent(eventData, selectedEvent?.id);
  };

  const handleSlotClick = (hour: number, isHalf: boolean) => {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const h = Math.floor(hour).toString().padStart(2, "0");
    const m = isHalf ? "30" : "00";
    setSelectedEvent(null);
    setSelectedDate(`${dateStr}T${h}:${m}`);
    setModalOpen(true);
  };

  const dayLabel = format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <button onClick={() => onDateChange(subDays(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-[#888]" />
        </button>
        <div className="text-center">
          <div className={`chalk-text text-lg ${today ? "text-[#f0c040]" : "text-[#a0a0b0]"}`}>
            {dayLabel.toUpperCase()}
          </div>
        </div>
        <button onClick={() => onDateChange(addDays(currentDate, 1))} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-[#888]" />
        </button>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="border border-[#3a3a4a] rounded-xl p-3 mb-3 space-y-1">
          <span className="chalk-text text-xs text-[#666] tracking-wider">DIA INTEIRO</span>
          {allDayEvents.map((evt) => (
            <div
              key={evt.id}
              className="event-tag text-[#e8e8e8] cursor-pointer"
              style={{ backgroundColor: evt.color + "40" }}
              onClick={() => { setSelectedEvent(evt); setSelectedDate(""); setModalOpen(true); }}
            >
              {evt.title}
            </div>
          ))}
        </div>
      )}

      {/* Time grid */}
      <div ref={gridRef} className="overflow-y-auto border border-[#3a3a4a] rounded-xl" style={{ maxHeight: "calc(100vh - 260px)" }}>
        <div className="grid grid-cols-[70px_1fr] relative">
          {/* Time labels */}
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="flex items-start justify-end pr-3 pt-1" style={{ height: HOUR_HEIGHT }}>
                <span className="chalk-text text-sm text-[#666]">{`${h.toString().padStart(2, "0")}:00`}</span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className={`relative border-l border-[#3a3a4a] ${today ? "bg-[#f0c040]/3" : ""}`}>
            {/* Hour and half-hour lines */}
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }}>
                <div
                  className="border-b border-[#3a3a4a]/40 cursor-pointer hover:bg-white/3"
                  style={{ height: HOUR_HEIGHT / 2 }}
                  onClick={() => handleSlotClick(h, false)}
                />
                <div
                  className="border-b border-dashed border-[#3a3a4a]/20 cursor-pointer hover:bg-white/3"
                  style={{ height: HOUR_HEIGHT / 2 }}
                  onClick={() => handleSlotClick(h, true)}
                />
              </div>
            ))}

            {/* Events */}
            {dayEvents.map((evt) => {
              const { top, height } = getEventPosition(evt);
              return (
                <div
                  key={evt.id}
                  className="absolute left-1 right-1 rounded-lg px-3 py-1.5 cursor-pointer overflow-hidden z-10"
                  style={{
                    top, height,
                    backgroundColor: evt.color + "30",
                    borderLeft: `4px solid ${evt.color}`,
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); setSelectedDate(""); setModalOpen(true); }}
                >
                  <div className="chalk-text text-sm text-[#e8e8e8] font-semibold">{evt.title}</div>
                  <div className="chalk-text text-xs text-[#a0a0b0]">
                    {format(parseISO(evt.start_time), "HH:mm")} - {format(parseISO(evt.end_time), "HH:mm")}
                  </div>
                  {evt.description && height > 50 && (
                    <div className="chalk-text text-xs text-[#888] mt-0.5 line-clamp-2">{evt.description}</div>
                  )}
                </div>
              );
            })}

            {/* Current time line */}
            {today && getHours(currentTime) >= START_HOUR && getHours(currentTime) < END_HOUR && (
              <div className="current-time-line" style={{ top: getCurrentTimePosition() }} />
            )}
          </div>
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
