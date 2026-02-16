"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Task, Note } from "@/types/database";
import { Check, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

export default function RightPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [tasksRes, notesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(2),
    ]);
    setTasks(tasksRes.data || []);
    setNotes(notesRes.data || []);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTask = async (task: Task) => {
    await supabase
      .from("tasks")
      .update({ completed: true, updated_at: new Date().toISOString() })
      .eq("id", task.id);
    fetchData();
  };

  const addTask = async () => {
    if (!user || !newTask.trim()) return;
    setAddingTask(true);
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTask.trim(),
      priority: "medium",
    });
    if (error) toast.error("Erro ao criar tarefa");
    else {
      setNewTask("");
      fetchData();
    }
    setAddingTask(false);
  };

  const monthName = format(new Date(), "MMMM", { locale: ptBR });

  return (
    <div className="w-72 h-full border-l border-[#2a2a3a] bg-[#1a1a28] p-5 overflow-y-auto flex flex-col gap-6">
      {/* Task Checklist */}
      <div>
        <h3 className="chalk-title text-sm text-[#f0c040] tracking-widest mb-4">
          TAREFAS DE {monthName.toUpperCase()}
        </h3>

        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-2.5 group"
            >
              <button
                onClick={() => toggleTask(task)}
                className="task-check mt-0.5"
              >
                {task.completed && <Check className="w-3 h-3 text-[#1e1e2e]" />}
              </button>
              <span className="chalk-text text-sm text-[#c0c0c0] leading-tight">
                {task.title}
              </span>
            </div>
          ))}
        </div>

        {/* Quick add */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1 bg-transparent border-b border-[#3a3a4a] text-[#e8e8e8] text-sm chalk-text py-1 outline-none placeholder-[#555] focus:border-[#f0c040]/50"
            placeholder="Nova tarefa..."
          />
          <button
            onClick={addTask}
            disabled={addingTask || !newTask.trim()}
            className="text-[#888] hover:text-[#f0c040] transition-colors disabled:opacity-30"
          >
            {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-[#2a2a3a]" />

      {/* First Comment / Goals */}
      <div>
        <h3 className="chalk-title text-sm text-[#888] tracking-widest mb-3">
          METAS / OBJETIVOS
        </h3>
        <div className="space-y-1.5">
          {tasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-start gap-2">
              <span className="text-[#888] text-xs mt-0.5">&#8226;</span>
              <span className="chalk-text text-xs text-[#999] leading-tight">
                {task.title}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="chalk-text text-xs text-[#555]">Nenhuma tarefa pendente</p>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-[#2a2a3a]" />

      {/* Motivational sticky note */}
      <div className="mt-auto">
        {notes.length > 0 ? (
          notes.slice(0, 1).map((note) => (
            <div
              key={note.id}
              className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg p-4 sticky-note"
            >
              <p className="chalk-text text-lg text-[#e8e8e8] font-bold text-center leading-snug">
                {note.title}
              </p>
              {note.content && (
                <p className="chalk-text text-sm text-[#888] text-center mt-1">
                  {note.content}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg p-4 sticky-note">
            <p className="chalk-text text-lg text-[#e8e8e8] font-bold text-center leading-snug">
              VOCÊ É CAPAZ!
            </p>
            <p className="chalk-text text-sm text-[#888] text-center mt-1">
              NÃO ESQUEÇA DISSO
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
