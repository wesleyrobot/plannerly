# Plannerly

**Painel web de agenda mensal inteligente, simples e elegante.**

> "Organize seu mês. Visualize sua rotina."

## Tecnologias

### Frontend
- **Next.js** (React) - Framework moderno e rápido
- **TypeScript** - Código seguro e escalável
- **Tailwind CSS** - Estilo moderno e responsivo
- **FullCalendar.js** - Calendário mensal/semanal interativo
- **Lucide Icons** - Ícones clean e profissionais

### Backend (100% Supabase)
- **PostgreSQL** - Banco de dados
- **Supabase Auth** - Login por email/senha e Google
- **Supabase Realtime** - Atualização automática da agenda
- **Row Level Security** - Segurança por usuário

## Funcionalidades

- Calendário mensal, semanal e em lista
- Criação, edição e exclusão de eventos com cores
- Gestão de tarefas com prioridades (alta, média, baixa)
- Barra de progresso de tarefas
- Notas rápidas coloridas
- Dashboard com resumo geral
- Autenticação com email/senha e Google
- Atualização em tempo real
- Interface responsiva

## Como Iniciar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Copie a **URL** e a **Anon Key** do projeto
3. Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 3. Criar as tabelas no banco

1. Acesse o **SQL Editor** no painel do Supabase
2. Cole e execute o conteúdo do arquivo `supabase/schema.sql`

### 4. Configurar autenticação Google (opcional)

1. No Supabase, vá em **Authentication > Providers > Google**
2. Configure com suas credenciais do Google Cloud Console
3. Adicione `https://seu-dominio.com/auth/callback` como redirect URL

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Páginas de login e registro
│   ├── (dashboard)/     # Dashboard, calendário, tarefas, notas
│   ├── auth/callback/   # Callback OAuth
│   ├── layout.tsx       # Layout raiz
│   └── page.tsx         # Landing page
├── components/
│   ├── auth/            # Componentes de autenticação
│   ├── calendar/        # CalendarView, EventModal
│   ├── layout/          # Sidebar, Header
│   ├── notes/           # NoteGrid
│   └── tasks/           # TaskList
├── contexts/            # AuthContext
├── lib/                 # Clientes Supabase
└── types/               # Tipos TypeScript
```

## Deploy

### Frontend - Vercel
1. Conecte o repositório na [Vercel](https://vercel.com)
2. Configure as variáveis de ambiente
3. Deploy automático

### Backend - Supabase Cloud
O backend já está hospedado no Supabase Cloud.

## Roadmap (Fase 2)

- [ ] PWA (funciona offline)
- [ ] Tema claro / escuro
- [ ] Notificações
- [ ] Exportar PDF
- [ ] Integração com Google Calendar
- [ ] Versão mobile-first
