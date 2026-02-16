-- ============================================
-- Plannerly - Database Schema
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabela: events (Eventos do calendário)
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color TEXT DEFAULT '#6366f1',
  all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);

-- RLS para events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Tabela: tasks (Tarefas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- RLS para tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Tabela: notes (Notas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  color TEXT DEFAULT '#fef3c7',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- RLS para notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Tabela: implementation_stages (Etapas do pipeline)
-- ============================================
CREATE TABLE IF NOT EXISTS public.implementation_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stages_user_id ON public.implementation_stages(user_id);

ALTER TABLE public.implementation_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stages"
  ON public.implementation_stages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stages"
  ON public.implementation_stages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stages"
  ON public.implementation_stages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stages"
  ON public.implementation_stages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Tabela: clients (Clientes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  stage_id UUID REFERENCES public.implementation_stages(id) ON DELETE SET NULL,
  notes TEXT,
  start_date DATE,
  expected_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_stage_id ON public.clients(stage_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Colunas extras nos eventos (tipo + cliente)
-- ============================================
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'event'
  CHECK (event_type IN ('event', 'meeting', 'deadline'));
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- ============================================
-- Habilitar Realtime para todas as tabelas
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.implementation_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
