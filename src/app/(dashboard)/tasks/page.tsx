"use client";

import TaskList from "@/components/tasks/TaskList";

export default function TasksPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-6">
        <h1 className="chalk-title text-2xl text-[#e8e8e8] tracking-widest">TAREFAS</h1>
        <p className="chalk-text text-[#888] mt-1">Gerencie suas tarefas do mês</p>
      </div>
      <TaskList />
    </div>
  );
}
