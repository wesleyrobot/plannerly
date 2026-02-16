"use client";

import { useState } from "react";
import ChalkboardCalendar from "@/components/calendar/ChalkboardCalendar";
import RightPanel from "@/components/layout/RightPanel";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  return (
    <div className="flex h-screen">
      <div className="flex-1 chalkboard overflow-y-auto p-6">
        <div className="relative z-10">
          <ChalkboardCalendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onSwitchToDay={(date) => {
              router.push("/dashboard/calendar");
            }}
          />
        </div>
      </div>
      <RightPanel />
    </div>
  );
}
