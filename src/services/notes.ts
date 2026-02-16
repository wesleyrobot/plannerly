import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Note = Database["public"]["Tables"]["notes"]["Row"];
type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];

export async function fetchNotes(userId: string) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as Note[];
}

export async function createNote(note: NoteInsert) {
  const { data, error } = await supabase.from("notes").insert(note).select().single();
  if (error) throw error;
  return data as Note;
}

export async function updateNote(id: string, updates: NoteUpdate) {
  const { data, error } = await supabase
    .from("notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw error;
}
