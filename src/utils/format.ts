/**
 * Format a number as Brazilian Real currency.
 * @example formatCurrency(1500) → "R$ 1.500,00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Format a date string (ISO) to dd/MM/yyyy.
 * @example formatDate("2026-02-16") → "16/02/2026"
 */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Format a datetime string (ISO) to HH:mm.
 * @example formatTime("2026-02-16T09:30:00") → "09:30"
 */
export function formatTime(isoDate: string): string {
  return isoDate.slice(11, 16);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
