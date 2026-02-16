import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export async function fetchClients(userId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", userId)
    .order("name");

  if (error) throw error;
  return data as Client[];
}

export async function fetchClientById(id: string) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Client;
}

export async function createClient(client: ClientInsert) {
  const { data, error } = await supabase.from("clients").insert(client).select().single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, updates: ClientUpdate) {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}
