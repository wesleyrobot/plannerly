"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Excluir",
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#2a2a3a] border border-[#3a3a4a] rounded-2xl shadow-2xl w-full max-w-sm p-6 m-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="chalk-title text-base text-[#e8e8e8] mb-1">{title}</h3>
            <p className="chalk-text text-sm text-[#888]">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 border border-[#3a3a4a] rounded-xl text-[#a0a0b0] hover:bg-white/5 transition-colors chalk-text text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl font-medium transition-colors text-sm chalk-text ${
              danger
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-[#f0c040] text-[#1e1e2e] hover:bg-[#f0c040]/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
