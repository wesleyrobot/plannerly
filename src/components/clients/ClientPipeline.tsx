"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Stage, Client, ClientInsert } from "@/types/database";
import ClientCard from "./ClientCard";
import ClientModal from "./ClientModal";
import { Plus, Pencil, Trash2, Check, X, DollarSign } from "lucide-react";

const DEFAULT_STAGES = [
  { name: "Contrato Assinado", color: "#6366f1", position: 0 },
  { name: "Reunião Inicial", color: "#8b5cf6", position: 1 },
  { name: "Configuração", color: "#3b82f6", position: 2 },
  { name: "Treinamento", color: "#06b6d4", position: 3 },
  { name: "Entrada em Produção", color: "#22c55e", position: 4 },
  { name: "Acompanhamento", color: "#f0c040", position: 5 },
];

const STAGE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#f0c040",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function ClientPipeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [defaultStageId, setDefaultStageId] = useState<string>("");

  // Drag state
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Inline stage editing
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState("");
  const [editingStageColor, setEditingStageColor] = useState("");

  // New stage inline
  const [addingStage, setAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState(STAGE_COLORS[0]);

  const editInputRef = useRef<HTMLInputElement>(null);
  const newStageInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchStages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("implementation_stages")
      .select("*")
      .eq("user_id", user.id)
      .order("position");

    if (data && data.length > 0) {
      setStages(data);
    } else {
      const inserts = DEFAULT_STAGES.map((s) => ({ ...s, user_id: user.id }));
      const { data: created } = await supabase
        .from("implementation_stages")
        .insert(inserts)
        .select();
      if (created) setStages(created);
    }
  }, [user, supabase]);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setClients(data);
  }, [user, supabase]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStages();
      await fetchClients();
      setLoading(false);
    };
    load();
  }, [fetchStages, fetchClients]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("clients-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients", filter: `user_id=eq.${user.id}` }, () => fetchClients())
      .on("postgres_changes", { event: "*", schema: "public", table: "implementation_stages", filter: `user_id=eq.${user.id}` }, () => fetchStages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase, fetchClients, fetchStages]);

  // ---- Client CRUD ----
  const saveClient = async (clientData: ClientInsert) => {
    if (clientData.id) {
      const { id, ...updateData } = clientData;
      await supabase.from("clients").update(updateData).eq("id", id);
    } else {
      await supabase.from("clients").insert(clientData);
    }
    await fetchClients();
  };

  const deleteClient = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    await fetchClients();
  };

  const moveClient = async (clientId: string, newStageId: string) => {
    setClients((prev) => prev.map((c) => c.id === clientId ? { ...c, stage_id: newStageId } : c));
    await supabase.from("clients").update({ stage_id: newStageId }).eq("id", clientId);
  };

  // ---- Stage CRUD (inline) ----
  const createStage = async () => {
    if (!user || !newStageName.trim()) return;
    const maxPos = stages.length > 0 ? Math.max(...stages.map((s) => s.position)) + 1 : 0;
    await supabase.from("implementation_stages").insert({
      user_id: user.id,
      name: newStageName.trim(),
      color: newStageColor,
      position: maxPos,
    });
    setNewStageName("");
    setNewStageColor(STAGE_COLORS[0]);
    setAddingStage(false);
    await fetchStages();
  };

  const updateStage = async (stageId: string) => {
    if (!editingStageName.trim()) return;
    await supabase.from("implementation_stages").update({
      name: editingStageName.trim(),
      color: editingStageColor,
    }).eq("id", stageId);
    setEditingStageId(null);
    await fetchStages();
  };

  const deleteStage = async (stageId: string) => {
    const stageClients = clients.filter((c) => c.stage_id === stageId);
    if (stageClients.length > 0) {
      if (!confirm(`Tem ${stageClients.length} cliente(s) nesta etapa. Eles ficarão sem etapa. Continuar?`)) return;
      await supabase.from("clients").update({ stage_id: null }).eq("stage_id", stageId);
    }
    await supabase.from("implementation_stages").delete().eq("id", stageId);
    await fetchStages();
    await fetchClients();
  };

  const startEditStage = (stage: Stage) => {
    setEditingStageId(stage.id);
    setEditingStageName(stage.name);
    setEditingStageColor(stage.color);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  // ---- Drag & Drop ----
  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    setDraggingClientId(clientId);
    e.dataTransfer.setData("clientId", clientId);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 50, 20);
    }
  };

  const handleDragEnd = () => {
    setDraggingClientId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) setDragOverStageId(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("clientId");
    if (clientId) moveClient(clientId, stageId);
    setDraggingClientId(null);
    setDragOverStageId(null);
  };

  // ---- Totals ----
  const totalGeral = clients.reduce((sum, c) => sum + (c.contract_value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="chalk-text text-[#888] text-lg">Carregando pipeline...</div>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="chalk-title text-2xl text-[#e8e8e8] tracking-wider">Pipeline de Clientes</h1>
          {totalGeral > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <DollarSign className="w-4 h-4 text-[#22c55e]" />
              <span className="chalk-text text-sm text-[#22c55e] font-semibold">
                Total: {formatCurrency(totalGeral)}
              </span>
              <span className="chalk-text text-xs text-[#555] ml-2">
                ({clients.filter(c => c.contract_value).length} contratos)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAddingStage(true);
              setTimeout(() => newStageInputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-2 px-3 py-2 text-[#888] border border-[#3a3a4a] rounded-xl hover:bg-white/5 transition-colors chalk-text text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Etapa
          </button>
          <button
            onClick={() => {
              setSelectedClient(null);
              setDefaultStageId(stages[0]?.id || "");
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 transition-colors chalk-text"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Pipeline columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {stages.map((stage) => {
          const stageClients = clients.filter((c) => c.stage_id === stage.id);
          const isDropTarget = dragOverStageId === stage.id;
          const isEditing = editingStageId === stage.id;
          const stageTotal = stageClients.reduce((sum, c) => sum + (c.contract_value || 0), 0);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72"
              onDrop={(e) => handleDrop(e, stage.id)}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
            >
              {/* Column header - inline editable */}
              <div className="mb-3 px-1 group">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      className="w-4 h-4 rounded-full flex-shrink-0 border border-[#555] cursor-pointer"
                      style={{ backgroundColor: editingStageColor }}
                      onClick={() => {
                        const idx = STAGE_COLORS.indexOf(editingStageColor);
                        setEditingStageColor(STAGE_COLORS[(idx + 1) % STAGE_COLORS.length]);
                      }}
                      title="Clique para mudar a cor"
                    />
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingStageName}
                      onChange={(e) => setEditingStageName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateStage(stage.id);
                        if (e.key === "Escape") setEditingStageId(null);
                      }}
                      className="flex-1 px-2 py-0.5 bg-[#1e1e2e] border border-[#f0c040]/30 rounded text-[#e8e8e8] chalk-text text-sm outline-none focus:ring-1 focus:ring-[#f0c040]/50 min-w-0"
                    />
                    <button onClick={() => updateStage(stage.id)} className="p-1 text-[#22c55e] hover:bg-[#22c55e]/10 rounded transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingStageId(null)} className="p-1 text-[#888] hover:bg-white/5 rounded transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <h3
                      className="chalk-text text-sm text-[#a0a0b0] tracking-wider uppercase font-semibold cursor-pointer hover:text-[#e8e8e8] transition-colors"
                      onDoubleClick={() => startEditStage(stage)}
                      title="Duplo clique para editar"
                    >
                      {stage.name}
                    </h3>
                    <span className="chalk-text text-xs text-[#555]">{stageClients.length}</span>
                    <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditStage(stage)}
                        className="p-1 text-[#666] hover:text-[#f0c040] rounded transition-colors"
                        title="Editar etapa"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteStage(stage.id)}
                        className="p-1 text-[#666] hover:text-red-400 rounded transition-colors"
                        title="Excluir etapa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Stage total */}
                {stageTotal > 0 && !isEditing && (
                  <div className="mt-1 chalk-text text-xs text-[#666]">
                    {formatCurrency(stageTotal)}
                  </div>
                )}
              </div>

              {/* Column body */}
              <div
                className={`border rounded-xl p-2 space-y-2 min-h-[200px] transition-all duration-200 ${
                  isDropTarget
                    ? "bg-[#f0c040]/5 border-[#f0c040]/40 shadow-[0_0_20px_rgba(240,192,64,0.1)]"
                    : "bg-[#1e1e2e]/50 border-[#3a3a4a]/50"
                }`}
              >
                {stageClients.map((client) => (
                  <div
                    key={client.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, client.id)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <ClientCard
                      client={client}
                      isDragging={draggingClientId === client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setDefaultStageId("");
                        setModalOpen(true);
                      }}
                    />
                  </div>
                ))}

                {stageClients.length === 0 && !isDropTarget && (
                  <div className="flex items-center justify-center h-20 text-[#444] chalk-text text-sm">
                    Arraste clientes aqui
                  </div>
                )}

                {isDropTarget && stageClients.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-[#f0c040]/60 chalk-text text-sm border-2 border-dashed border-[#f0c040]/30 rounded-lg">
                    Solte aqui
                  </div>
                )}

                {/* Quick add button */}
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setDefaultStageId(stage.id);
                    setModalOpen(true);
                  }}
                  className="w-full py-2 border border-dashed border-[#3a3a4a] rounded-lg text-[#555] hover:text-[#888] hover:border-[#555] transition-colors chalk-text text-sm"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          );
        })}

        {/* New stage column (inline) */}
        {addingStage && (
          <div className="flex-shrink-0 w-72">
            <div className="mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <button
                  className="w-4 h-4 rounded-full flex-shrink-0 border border-[#555] cursor-pointer"
                  style={{ backgroundColor: newStageColor }}
                  onClick={() => {
                    const idx = STAGE_COLORS.indexOf(newStageColor);
                    setNewStageColor(STAGE_COLORS[(idx + 1) % STAGE_COLORS.length]);
                  }}
                  title="Clique para mudar a cor"
                />
                <input
                  ref={newStageInputRef}
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createStage();
                    if (e.key === "Escape") { setAddingStage(false); setNewStageName(""); }
                  }}
                  placeholder="Nome da etapa..."
                  className="flex-1 px-2 py-0.5 bg-[#1e1e2e] border border-[#f0c040]/30 rounded text-[#e8e8e8] placeholder-[#555] chalk-text text-sm outline-none focus:ring-1 focus:ring-[#f0c040]/50 min-w-0"
                />
                <button onClick={createStage} disabled={!newStageName.trim()} className="p-1 text-[#22c55e] hover:bg-[#22c55e]/10 rounded transition-colors disabled:opacity-30">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setAddingStage(false); setNewStageName(""); }} className="p-1 text-[#888] hover:bg-white/5 rounded transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="border border-dashed border-[#3a3a4a]/50 rounded-xl p-2 min-h-[200px] flex items-center justify-center">
              <span className="chalk-text text-sm text-[#444]">Nova coluna</span>
            </div>
          </div>
        )}
      </div>

      {/* Unassigned clients */}
      {clients.filter((c) => !c.stage_id).length > 0 && (
        <div className="mt-6">
          <h3 className="chalk-text text-sm text-[#666] tracking-wider uppercase mb-2">Sem Etapa</h3>
          <div className="flex flex-wrap gap-2">
            {clients
              .filter((c) => !c.stage_id)
              .map((client) => (
                <div
                  key={client.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, client.id)}
                  onDragEnd={handleDragEnd}
                  className="w-64 cursor-grab active:cursor-grabbing"
                >
                  <ClientCard
                    client={client}
                    isDragging={draggingClientId === client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setDefaultStageId("");
                      setModalOpen(true);
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      <ClientModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedClient(null); }}
        onSave={saveClient}
        onDelete={deleteClient}
        client={selectedClient}
        stages={stages}
        defaultStageId={defaultStageId}
        userId={user?.id || ""}
      />
    </div>
  );
}
