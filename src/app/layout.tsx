import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Plannerly - Organize seu mês",
  description: "Painel web de agenda mensal inteligente, simples e elegante. Organize seu mês. Visualize sua rotina.",
  keywords: ["agenda", "calendário", "tarefas", "planejamento", "organização"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" data-darkreader-mode="disabled">
      <head>
        <meta name="darkreader-lock" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[#1e1e2e] text-[#e0e0e0]`}>
        {children}
      </body>
    </html>
  );
}
