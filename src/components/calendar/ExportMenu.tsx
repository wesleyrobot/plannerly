"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileText, Table } from "lucide-react";
import { Event } from "@/types/database";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportMenuProps {
  events: Event[];
  periodLabel: string;
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  event: "Evento",
  meeting: "Reunião",
  deadline: "Prazo",
};

export default function ExportMenu({ events, periodLabel }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const rows = events.map((ev) => [
    ev.title,
    format(parseISO(ev.start_time), "dd/MM/yyyy", { locale: ptBR }),
    ev.all_day ? "Dia inteiro" : format(parseISO(ev.start_time), "HH:mm"),
    ev.all_day ? "-" : format(parseISO(ev.end_time), "HH:mm"),
    EVENT_TYPE_LABEL[ev.event_type || "event"] || "Evento",
    ev.description || "",
  ]);

  const exportCSV = () => {
    const header = ["Título", "Data", "Início", "Fim", "Tipo", "Descrição"];
    const lines = [header, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenda-${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text(`Agenda — ${periodLabel}`, 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [["Título", "Data", "Início", "Fim", "Tipo", "Descrição"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [240, 192, 64], textColor: 30 },
      alternateRowStyles: { fillColor: [245, 245, 255] },
    });

    doc.save(`agenda-${periodLabel}.pdf`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 border border-[#3a3a4a] rounded-lg text-[#a0a0b0] hover:bg-white/5 transition-colors chalk-text text-sm"
      >
        <Download className="w-4 h-4" />
        Exportar
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-[#2a2a3a] border border-[#3a3a4a] rounded-xl shadow-xl overflow-hidden z-50">
          <button
            onClick={exportPDF}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#e8e8e8] hover:bg-white/5 transition-colors chalk-text"
          >
            <FileText className="w-4 h-4 text-[#f87171]" />
            PDF
          </button>
          <button
            onClick={exportCSV}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#e8e8e8] hover:bg-white/5 transition-colors chalk-text border-t border-[#3a3a4a]"
          >
            <Table className="w-4 h-4 text-[#22c55e]" />
            CSV
          </button>
        </div>
      )}
    </div>
  );
}
