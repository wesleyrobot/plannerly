"use client";

import { Client } from "@/types/database";
import { GripVertical, Mail, Phone, User, DollarSign, ExternalLink } from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { formatCurrency } from "@/utils/format";

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  isDragging?: boolean;
}

export default function ClientCard({ client, onClick, isDragging }: ClientCardProps) {
  return (
    <div
      className={`pipeline-card group ${isDragging ? "opacity-50 ring-2 ring-[#f0c040]/40 scale-95" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-[#555] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
        <div className="flex-1 min-w-0">
          <h4 className="chalk-text text-base text-[#e8e8e8] font-semibold truncate">
            {client.name}
          </h4>
          {client.contact_name && (
            <div className="flex items-center gap-1.5 mt-1">
              <User className="w-3 h-3 text-[#666]" />
              <span className="chalk-text text-xs text-[#888] truncate">{client.contact_name}</span>
            </div>
          )}
          {client.contact_email && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 text-[#666]" />
              <span className="chalk-text text-xs text-[#888] truncate">{client.contact_email}</span>
            </div>
          )}
          {client.contact_phone && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-[#666]" />
              <span className="chalk-text text-xs text-[#888] truncate">{client.contact_phone}</span>
            </div>
          )}
          {client.contract_value != null && client.contract_value > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <DollarSign className="w-3 h-3 text-[#22c55e]" />
              <span className="chalk-text text-xs text-[#22c55e] font-semibold">
                {formatCurrency(client.contract_value)}
              </span>
            </div>
          )}
          {client.start_date && (
            <div className="mt-1.5 text-[10px] text-[#666] tracking-wider">
              INÍCIO: {format(parseISO(client.start_date), "dd/MM/yyyy")}
            </div>
          )}
          <Link
            href={`/dashboard/clients/${client.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-2 text-[10px] text-[#f0c040]/60 hover:text-[#f0c040] transition-colors tracking-wider"
          >
            <ExternalLink className="w-3 h-3" />
            VER DETALHES
          </Link>
        </div>
      </div>
    </div>
  );
}
