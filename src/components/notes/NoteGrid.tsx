"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Note, NoteInsert } from "@/types/database";
import { Plus, Trash2, X, Loader2, StickyNote } from "lucide-react";
import toast from "react-hot-toast";

const NOTE_COLORS = [
  "#3a3520", // dark amber
  "#1e2a3a", // dark blue
  "#1e3a28", // dark green
  "#3a1e30", // dark pink
  "#2e1e3a", // dark purple
  "#3a2e1e", // dark orange
];

export default function NoteGrid() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notes").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar notas"); return; }
    setNotes(data || []);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("notes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${user.id}` }, () => fetchNotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotes]);

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setLoading(true);
    if (editingNote) {
      const { error } = await supabase.from("notes").update({ title, content, color, updated_at: new Date().toISOString() }).eq("id", editingNote.id);
      if (error) toast.error("Erro ao atualizar nota"); else toast.success("Nota atualizada!");
    } else {
      const noteData: NoteInsert = { user_id: user.id, title: title.trim(), content, color };
      const { error } = await supabase.from("notes").insert(noteData);
      if (error) toast.error("Erro ao criar nota"); else toast.success("Nota criada!");
    }
    setTitle(""); setContent(""); setColor(NOTE_COLORS[0]); setEditingNote(null); setShowForm(false); setLoading(false); fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    toast.success("Nota excluída!"); fetchNotes();
  };

  const openEdit = (note: Note) => {
    setTitle(note.title); setContent(note.content); setColor(note.color); setEditingNote(note); setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditingNote(null); setTitle(""); setContent(""); setColor(NOTE_COLORS[0]); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Nota
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="chalk-title text-xl text-[#e8e8e8]">
                {editingNote ? "Editar Nota" : "Nova Nota"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>
            <form onSubmit={saveNote} className="space-y-4">
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555] chalk-text text-lg"
                placeholder="Título da nota" required autoFocus
              />
              <textarea
                value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none resize-none text-[#e8e8e8] placeholder-[#555] chalk-text text-lg"
                placeholder="Conteúdo..." rows={5}
              />
              <div>
                <label className="block text-sm text-[#888] mb-2">Cor</label>
                <div className="flex gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c} type="button" onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? "border-[#f0c040] scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#3a3a4a] rounded-xl text-[#a0a0b0] hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 disabled:opacity-50 flex items-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingNote ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes grid */}
      {notes.length === 0 ? (
        <div className="bg-[#2a2a3a] rounded-2xl border border-[#3a3a4a] p-12 text-center">
          <StickyNote className="w-12 h-12 text-[#444] mx-auto mb-4" />
          <p className="chalk-text text-[#888] font-medium">Nenhuma nota ainda</p>
          <p className="chalk-text text-[#555] text-sm mt-1">Clique em &quot;Nova Nota&quot; para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => openEdit(note)}
              className="rounded-2xl border border-[#3a3a4a] p-5 cursor-pointer hover:border-[#555] transition-all group sticky-note"
              style={{ backgroundColor: note.color }}
            >
              <div className="flex items-start justify-between">
                <h3 className="chalk-text text-xl font-bold text-[#e8e8e8] flex-1">{note.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="p-1.5 text-[#555] hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {note.content && (
                <p className="chalk-text text-sm text-[#a0a0b0] mt-2 line-clamp-4 whitespace-pre-wrap">{note.content}</p>
              )}
              <p className="text-xs text-[#555] mt-4">
                {new Date(note.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
