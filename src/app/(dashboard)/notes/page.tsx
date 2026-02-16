"use client";

import NoteGrid from "@/components/notes/NoteGrid";

export default function NotesPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-6">
        <h1 className="chalk-title text-2xl text-[#e8e8e8] tracking-widest">NOTAS</h1>
        <p className="chalk-text text-[#888] mt-1">Suas anotações rápidas</p>
      </div>
      <NoteGrid />
    </div>
  );
}
