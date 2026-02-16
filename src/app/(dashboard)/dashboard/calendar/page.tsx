"use client";

import { useState } from "react";
import ChalkboardCalendar from "@/components/calendar/ChalkboardCalendar";
import WeeklyView from "@/components/calendar/WeeklyView";
import DailyView from "@/components/calendar/DailyView";
import ViewSwitcher, { CalendarViewType } from "@/components/calendar/ViewSwitcher";

export default function CalendarPage() {
  const [view, setView] = useState<CalendarViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="chalkboard min-h-screen p-6">
      <div className="relative z-10">
        {/* Header with title and view switcher */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="chalk-title text-2xl text-[#e8e8e8] tracking-widest">
            {view === "month" ? "MENSAL" : view === "week" ? "SEMANAL" : "DIÁRIO"}
          </h2>
          <div className="flex items-center gap-3">
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
