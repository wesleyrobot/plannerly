# Plannerly

Painel web de agenda mensal inteligente, simples e elegante.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Auth + PostgreSQL + Realtime)

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Rodar migrations no Supabase (SQL Editor) — ver seção abaixo

# 4. Iniciar dev
npm run dev
```

## SQL Migrations

Execute no Supabase SQL Editor:

```sql
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT NULL
  CHECK (recurrence IN ('daily', 'weekly', 'monthly', NULL)),
ADD COLUMN IF NOT EXISTS recurrence_end DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT NULL
  CHECK (event_type IN ('event', 'meeting', 'deadline', NULL)),
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
```

## Estrutura

```
src/
├── app/(dashboard)/dashboard/
│   ├── page.tsx          # Home com métricas
│   ├── calendar/         # Calendário mensal
│   ├── clients/[id]/     # Detalhe do cliente
│   ├── tasks/            # Lista de tarefas
│   ├── notes/            # Notas
│   └── relatorio/        # Relatório financeiro
├── components/
│   ├── calendar/         # Calendário + modais + export
│   ├── clients/          # Pipeline + cards
│   ├── dashboard/        # MetricsBar
│   ├── layout/           # Sidebar, GlobalSearch, Shortcuts
│   └── ui/               # ErrorBoundary, ConfirmDialog
├── constants/
│   ├── events.ts         # Labels de tipo/prioridade/recorrência
│   └── theme.ts          # Paleta de cores
├── services/             # Camada de acesso ao Supabase
│   ├── clients.ts
│   ├── events.ts
│   ├── notes.ts
│   └── tasks.ts
└── utils/
    ├── date.ts           # expandRecurringEvents, getRealEventId
    └── format.ts         # formatCurrency, formatDate, formatTime
```

## Features

- Calendário mensal com drag & drop
- Eventos recorrentes (diário / semanal / mensal)
- Pipeline de clientes (Kanban com drag & drop)
- Busca global (`Ctrl+K`)
- Atalhos de teclado (`N` `T` `C` `?`)
- Exportar agenda em PDF ou CSV
- Relatório financeiro mensal
- Notificações do navegador
- PWA (instalável no celular)
- Responsivo com bottom nav em mobile
