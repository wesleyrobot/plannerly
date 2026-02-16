"use client";

import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";

// Dispatches custom events that individual components can listen to
export function useKeyboardShortcut(key: string, callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.toLowerCase() === key.toLowerCase() && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, enabled]);
}

// Dispatch a named shortcut event
export function dispatchShortcut(name: string) {
  window.dispatchEvent(new CustomEvent(`shortcut:${name}`));
}

// Listen to a named shortcut event
export function useShortcutEvent(name: string, callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(`shortcut:${name}`, handler);
    return () => window.removeEventListener(`shortcut:${name}`, handler);
  }, [name, callback]);
}

const SHORTCUTS = [
  { key: "N", description: "Novo evento" },
  { key: "T", description: "Nova tarefa" },
  { key: "C", description: "Novo cliente" },
  { key: "Ctrl+K", description: "Busca global" },
  { key: "?", description: "Ver atalhos" },
];

export default function KeyboardShortcutsHelper() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?") { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === "Escape") setOpen(false);
      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey) {
        if (tag !== "INPUT" && tag !== "TEXTAREA") dispatchShortcut("new-event");
      }
      if (e.key.toLowerCase() === "t" && !e.ctrlKey && !e.metaKey) {
        if (tag !== "INPUT" && tag !== "TEXTAREA") dispatchShortcut("new-task");
      }
      if (e.key.toLowerCase() === "c" && !e.ctrlKey && !e.metaKey) {
        if (tag !== "INPUT" && tag !== "TEXTAREA") dispatchShortcut("new-client");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5 text-[#f0c040]" />
          <h2 className="chalk-title text-lg text-[#e8e8e8]">Atalhos de Teclado</h2>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-[#3a3a4a] last:border-0">
              <span className="chalk-text text-[#aaa] text-sm">{s.description}</span>
              <kbd className="px-2.5 py-1 bg-[#1e1e2e] border border-[#4a4a5a] rounded-lg text-[#f0c040] text-xs font-mono">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#555] mt-4 text-center tracking-wider">
          PRESSIONE ? PARA FECHAR
        </p>
      </div>
    </div>
  );
}
