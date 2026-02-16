"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Event, EventInsert } from "@/types/database";
import toast from "react-hot-toast";

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
    setEvents(data || []);
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
        .eq("id", existingId);
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
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir evento"); return; }
    toast.success("Evento excluído!");
    fetchEvents();
  };

  return { events, loading, saveEvent, deleteEvent, refetch: fetchEvents };
}
