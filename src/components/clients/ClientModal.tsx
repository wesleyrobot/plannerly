"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import { Client, ClientInsert, Stage } from "@/types/database";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientInsert) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  client?: Client | null;
  stages: Stage[];
  defaultStageId?: string;
  userId: string;
}

export default function ClientModal({
  isOpen, onClose, onSave, onDelete, client, stages, defaultStageId, userId,
}: ClientModalProps) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [stageId, setStageId] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setContactName(client.contact_name || "");
      setContactEmail(client.contact_email || "");
      setContactPhone(client.contact_phone || "");
      setStageId(client.stage_id || "");
      setNotes(client.notes || "");
      setStartDate(client.start_date || "");
      setExpectedEndDate(client.expected_end_date || "");
      setContractValue(client.contract_value ? String(client.contract_value) : "");
    } else {
      setName("");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setStageId(defaultStageId || "");
      setNotes("");
      setStartDate("");
      setExpectedEndDate("");
      setContractValue("");
    }
  }, [client, defaultStageId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...(client?.id ? { id: client.id } : {}),
        user_id: userId,
        name,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        stage_id: stageId || null,
        notes: notes || null,
        start_date: startDate || null,
        expected_end_date: expectedEndDate || null,
        contract_value: contractValue ? parseFloat(contractValue) : null,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(client.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="chalk-title text-xl text-[#e8e8e8]">
            {client ? "Editar Cliente" : "Novo Cliente"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#888]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#888] mb-1">Nome da Empresa</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555] chalk-text text-lg"
              placeholder="Nome do cliente"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1">Etapa</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] chalk-text"
            >
              <option value="">Sem etapa</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#888] mb-1">Contato</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555]"
                placeholder="Nome do contato"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-1">Telefone</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555]"
                placeholder="(11) 99999-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1">Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555]"
              placeholder="contato@empresa.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#888] mb-1">Data Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888] mb-1">Previsão Conclusão</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1">Remuneração (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555] chalk-text"
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none resize-none text-[#e8e8e8] placeholder-[#555] chalk-text"
              placeholder="Notas sobre o cliente"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#3a3a4a]">
            {client && onDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-[#3a3a4a] rounded-xl text-[#a0a0b0] hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#f0c040] text-[#1e1e2e] rounded-xl font-medium hover:bg-[#f0c040]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {client ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      isOpen={confirmDelete}
      title="Excluir cliente"
      message={`Tem certeza que deseja excluir "${client?.name}"? Esta ação não pode ser desfeita.`}
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(false)}
    />
    </>
  );
}
