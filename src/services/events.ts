import { createClient as getSupabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Event = Database["public"]["Tables"]["events"]["Row"];
type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export async function fetchEvents(userId: string, startDate: string, endDate: string) {
  const { data, error } = await getSupabase()
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time");

  if (error) throw error;
  return data as Event[];
}

export async function createEvent(event: EventInsert) {
  const { data, error } = await getSupabase().from("events").insert(event).select().single();
  if (error) throw error;
  return data as Event;
}

export async function updateEvent(id: string, updates: EventUpdate) {
  const { data, error } = await getSupabase()
    .from("events")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(id: string) {
  const { error } = await getSupabase().from("events").delete().eq("id", id);
  if (error) throw error;
}
