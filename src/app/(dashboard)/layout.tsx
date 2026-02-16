"use client";

import Sidebar from "@/components/layout/Sidebar";
import RobotAssistant from "@/components/assistant/RobotAssistant";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#2a2a3a",
            color: "#e8e8e8",
            border: "1px solid #3a3a4a",
          },
        }}
      />
      <div className="flex min-h-screen bg-[#1e1e2e]">
        <Sidebar />
        <main className="flex-1 ml-16">{children}</main>
        <RobotAssistant />
      </div>
    </AuthProvider>
  );
}
