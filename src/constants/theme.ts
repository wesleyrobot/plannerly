/** Dark chalkboard palette */
export const COLORS = {
  bg: "#1e1e2e",
  surface: "#2a2a3a",
  border: "#3a3a4a",
  accent: "#f0c040",
  text: {
    primary: "#e8e8e8",
    secondary: "#a0a0b0",
    muted: "#666",
    faint: "#444",
  },
  status: {
    success: "#22c55e",
    error: "#f87171",
    info: "#60a5fa",
    purple: "#a78bfa",
    warning: "#f97316",
  },
} as const;

/** Event color palette (matches EventModal) */
export const EVENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
] as const;

/** Stage/pipeline color palette */
export const STAGE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#f0c040",
] as const;
