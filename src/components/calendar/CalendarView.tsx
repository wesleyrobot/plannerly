"use client";

import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event, EventInsert } from "@/types/database";
import EventModal from "./EventModal";
import toast from "react-hot-toast";

export default function CalendarView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { user } = useAuth();
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar eventos");
      return;
    }
    setEvents(data || []);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchEvents]);

  const handleDateClick = (info: { dateStr: string }) => {
    setSelectedEvent(null);
    setSelectedDate(info.dateStr);
    setModalOpen(true);
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate("");
      setModalOpen(true);
    }
  };

  const handleSaveEvent = async (eventData: EventInsert) => {
    if (selectedEvent) {
      const { error } = await supabase
        .from("events")
        .update({
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          color: eventData.color,
          all_day: eventData.all_day,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedEvent.id);

      if (error) {
        toast.error("Erro ao atualizar evento");
        return;
      }
      toast.success("Evento atualizado!");
    } else {
      const { error } = await supabase.from("events").insert(eventData);

      if (error) {
        toast.error("Erro ao criar evento");
        return;
      }
      toast.success("Evento criado!");
    }
    fetchEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir evento");
      return;
    }
    toast.success("Evento excluído!");
    fetchEvents();
  };

  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start_time,
    end: event.end_time,
    allDay: event.all_day,
    backgroundColor: event.color,
    borderColor: event.color,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <style>{`
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-today-bg-color: #eef2ff;
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #f9fafb;
          font-family: inherit;
        }
        .fc .fc-button {
          background-color: #6366f1;
          border-color: #6366f1;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        .fc .fc-button:hover {
          background-color: #4f46e5;
          border-color: #4f46e5;
        }
        .fc .fc-button-active {
          background-color: #4338ca !important;
          border-color: #4338ca !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          text-transform: capitalize;
        }
        .fc .fc-col-header-cell-cushion {
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 0.75rem 0;
        }
        .fc .fc-daygrid-day-number {
          color: #374151;
          font-weight: 500;
          padding: 0.5rem;
        }
        .fc .fc-event {
          border-radius: 0.5rem;
          padding: 2px 6px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .fc .fc-daygrid-day:hover {
          background-color: #f3f4f6;
          cursor: pointer;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          background-color: #6366f1;
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        locale="pt-br"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listMonth",
        }}
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          list: "Lista",
        }}
        events={calendarEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        editable={false}
        selectable={true}
        dayMaxEvents={3}
        height="auto"
        aspectRatio={1.5}
      />

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        selectedDate={selectedDate}
        userId={user?.id || ""}
      />
    </div>
  );
}
