"use client";

import ClientPipeline from "@/components/clients/ClientPipeline";

export default function ClientsPage() {
  return (
    <div className="flex h-screen">
      <div className="flex-1 chalkboard overflow-y-auto p-6">
        <div className="relative z-10">
          <ClientPipeline />
        </div>
      </div>
    </div>
  );
}
