"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Task, TaskInsert } from "@/types/database";
import {
  Plus, Check, Trash2, Circle, AlertCircle,
  ArrowUp, ArrowRight, ArrowDown, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

const priorityConfig = {
  high: { icon: ArrowUp, color: "text-red-400", bg: "bg-red-400/10", label: "Alta" },
  medium: { icon: ArrowRight, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Média" },
  low: { icon: ArrowDown, color: "text-green-400", bg: "bg-green-400/10", label: "Baixa" },
};

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const { user } = useAuth();

  // Keyboard shortcut: T = new task
  useEffect(() => {
    const handler = () => setShowForm(true);
    window.addEventListener("shortcut:new-task", handler);
    return () => window.removeEventListener("shortcut:new-task", handler);
  }, []);
  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar tarefas"); return; }
    setTasks(data || []);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTasks]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;
    setLoading(true);
    const taskData: TaskInsert = { user_id: user.id, title: newTitle.trim(), priority: newPriority, due_date: newDueDate || null };
    const { error } = await supabase.from("tasks").insert(taskData);
    if (error) toast.error("Erro ao criar tarefa");
    else { toast.success("Tarefa criada!"); setNewTitle(""); setNewDueDate(""); setShowForm(false); fetchTasks(); }
    setLoading(false);
  };

  const toggleTask = async (task: Task) => {
    await supabase.from("tasks").update({ completed: !task.completed, updated_at: new Date().toISOString() }).eq("id", task.id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("Tarefa excluída!");
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-[#2a2a3a] rounded-2xl border border-[#3a3a4a] p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="chalk-text text-sm text-[#a0a0b0]">Progresso</span>
          <span className="chalk-text text-sm text-[#888]">
            {completedCount}/{tasks.length} concluídas
          </span>
        </div>
        <div className="w-full h-3 bg-[#1e1e2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#f0c040] to-[#e0a030] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filters and add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#f0c040] text-[#1e1e2e]"
                  : "bg-[#2a2a3a] text-[#a0a0b0] hover:bg-[#333345] border border-[#3a3a4a]"
              }`}
            >
              {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Concluídas"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addTask} className="bg-[#2a2a3a] rounded-2xl border border-[#3a3a4a] p-6 space-y-4">
          <input
            type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555] chalk-text text-lg"
            placeholder="O que precisa fazer?" required autoFocus
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-[#888] mb-1">Prioridade</label>
              <select
                value={newPriority} onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl outline-none text-[#e8e8e8]"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm text-[#888] mb-1">Prazo</label>
              <input
                type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl outline-none text-[#e8e8e8]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#3a3a4a] rounded-xl text-[#a0a0b0] hover:bg-white/5">Cancelar</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="bg-[#2a2a3a] rounded-2xl border border-[#3a3a4a] p-12 text-center">
            <AlertCircle className="w-12 h-12 text-[#444] mx-auto mb-4" />
            <p className="chalk-text text-[#888] font-medium">Nenhuma tarefa encontrada</p>
            <p className="chalk-text text-[#555] text-sm mt-1">Clique em &quot;Nova Tarefa&quot; para começar</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const priority = priorityConfig[task.priority];
            const PriorityIcon = priority.icon;
            return (
              <div
                key={task.id}
                className={`bg-[#2a2a3a] rounded-xl border border-[#3a3a4a] p-4 flex items-center gap-4 group hover:bg-[#303045] transition-all ${
                  task.completed ? "opacity-50" : ""
                }`}
              >
                <button
                  onClick={() => toggleTask(task)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    task.completed ? "bg-[#f0c040] border-[#f0c040]" : "border-[#555] hover:border-[#f0c040]"
                  }`}
                >
                  {task.completed ? <Check className="w-4 h-4 text-[#1e1e2e]" /> : <Circle className="w-4 h-4 text-transparent" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`chalk-text text-lg ${task.completed ? "line-through text-[#555]" : "text-[#e8e8e8]"}`}>{task.title}</p>
                  {task.due_date && <p className="text-xs text-[#666] mt-0.5">Prazo: {new Date(task.due_date).toLocaleDateString("pt-BR")}</p>}
                </div>
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${priority.color} ${priority.bg}`}>
                  <PriorityIcon className="w-3 h-3" />{priority.label}
                </span>
                <button onClick={() => deleteTask(task.id)} className="p-2 text-[#555] hover:text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
