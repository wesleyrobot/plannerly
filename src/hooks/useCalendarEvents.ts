"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event, EventInsert } from "@/types/database";
import toast from "react-hot-toast";
import { addDays, addWeeks, addMonths, parseISO, isAfter, isBefore } from "date-fns";

interface UseCalendarEventsOptions {
  startDate: Date;
  endDate: Date;
}

export function useCalendarEvents({ startDate, endDate }: UseCalendarEventsOptions) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", startDate.toISOString())
      .lte("start_time", endDate.toISOString())
      .order("start_time", { ascending: true });

    if (error) { toast.error("Erro ao carregar eventos"); setLoading(false); return; }

    // Expand recurring events within the date range
    const rawEvents: Event[] = data || [];
    const expanded: Event[] = [];
    for (const ev of rawEvents) {
      expanded.push(ev);
      if (ev.recurrence) {
        const duration = new Date(ev.end_time).getTime() - new Date(ev.start_time).getTime();
        const recEnd = ev.recurrence_end ? parseISO(ev.recurrence_end) : endDate;
        let cursor = parseISO(ev.start_time);
        let safety = 0;
        while (safety++ < 500) {
          cursor = ev.recurrence === "daily"
            ? addDays(cursor, 1)
            : ev.recurrence === "weekly"
            ? addWeeks(cursor, 1)
            : addMonths(cursor, 1);
          if (isAfter(cursor, recEnd) || isAfter(cursor, endDate)) break;
          if (isBefore(cursor, startDate)) continue;
          const newEnd = new Date(cursor.getTime() + duration);
          expanded.push({
            ...ev,
            id: `${ev.id}_rec_${cursor.toISOString()}`,
            start_time: cursor.toISOString(),
            end_time: newEnd.toISOString(),
          });
        }
      }
    }
    setEvents(expanded);
    setLoading(false);
  }, [user, startDate.toISOString(), endDate.toISOString()]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`events-${startDate.toISOString()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `user_id=eq.${user.id}` }, () => fetchEvents())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchEvents]);

  const saveEvent = async (eventData: EventInsert, existingId?: string) => {
    if (existingId) {
      // Strip _rec_... suffix for recurring ghost events
      const realId = existingId.includes("_rec_") ? existingId.split("_rec_")[0] : existingId;
      const { error } = await supabase
        .from("events")
        .update({
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          color: eventData.color,
          all_day: eventData.all_day,
          event_type: eventData.event_type,
          client_id: eventData.client_id,
          recurrence: eventData.recurrence,
          recurrence_end: eventData.recurrence_end,
          updated_at: new Date().toISOString(),
        })
        .eq("id", realId);
      if (error) { toast.error("Erro ao atualizar evento"); return; }
      toast.success("Evento atualizado!");
    } else {
      const { error } = await supabase.from("events").insert(eventData);
      if (error) { toast.error("Erro ao criar evento"); return; }
      toast.success("Evento criado!");
    }
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    const realId = id.includes("_rec_") ? id.split("_rec_")[0] : id;
    const { error } = await supabase.from("events").delete().eq("id", realId);
    if (error) { toast.error("Erro ao excluir evento"); return; }
    toast.success("Evento excluído!");
    fetchEvents();
  };

  return { events, loading, saveEvent, deleteEvent, refetch: fetchEvents };
}
