import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  StickyNote,
  Zap,
  Shield,
  Smartphone,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Calendário Inteligente",
    description: "Visualize todos os seus eventos em um calendário mensal estilo chalkboard.",
    color: "bg-[#f0c040]/10 text-[#f0c040]",
  },
  {
    icon: CheckSquare,
    title: "Gestão de Tarefas",
    description: "Organize tarefas por prioridade, acompanhe o progresso e nunca perca um prazo.",
    color: "bg-green-400/10 text-green-400",
  },
  {
    icon: StickyNote,
    title: "Notas Rápidas",
    description: "Anote ideias e lembretes com notas estilizadas direto no painel.",
    color: "bg-amber-400/10 text-amber-400",
  },
  {
    icon: Zap,
    title: "Tempo Real",
    description: "Todas as alterações são sincronizadas automaticamente em tempo real.",
    color: "bg-purple-400/10 text-purple-400",
  },
  {
    icon: Shield,
    title: "Seguro e Privado",
    description: "Seus dados são protegidos com autenticação segura e criptografia.",
    color: "bg-red-400/10 text-red-400",
  },
  {
    icon: Smartphone,
    title: "Responsivo",
    description: "Acesse sua agenda de qualquer dispositivo, em qualquer lugar.",
    color: "bg-cyan-400/10 text-cyan-400",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1e1e2e]">
      {/* Header */}
      <header className="px-6 py-4 border-b border-[#2a2a3a]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#f0c040] rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#1e1e2e]" />
            </div>
            <span className="chalk-title text-xl text-[#e8e8e8]">Plannerly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[#a0a0b0] hover:text-[#e8e8e8] font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="bg-[#f0c040] text-[#1e1e2e] px-5 py-2.5 rounded-xl font-medium hover:bg-[#f0c040]/90 transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 md:py-32 chalkboard">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#f0c040]/10 text-[#f0c040] px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-[#f0c040]/20">
            <Zap className="w-4 h-4" />
            Simples, elegante e poderoso
          </div>
          <h1 className="chalk-title text-4xl md:text-6xl text-[#e8e8e8] leading-tight tracking-wider">
            Organize seu mês.
            <br />
            <span className="text-[#f0c040]">Visualize sua rotina.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[#888] max-w-2xl mx-auto chalk-text">
            O Plannerly é o painel de agenda mensal que você sempre quis. Simples para usar,
            poderoso para organizar toda a sua vida.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#f0c040] text-[#1e1e2e] px-8 py-3.5 rounded-xl font-bold hover:bg-[#f0c040]/90 transition-colors text-lg"
            >
              Começar agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-[#3a3a4a] text-[#a0a0b0] px-8 py-3.5 rounded-xl font-medium hover:bg-white/5 transition-colors text-lg"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-[#161622]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="chalk-title text-3xl text-[#e8e8e8] tracking-widest">
              Tudo que você precisa
            </h2>
            <p className="mt-4 text-[#888] text-lg chalk-text">
              Ferramentas poderosas em uma interface simples e elegante
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#2a2a3a] rounded-2xl p-8 border border-[#3a3a4a] hover:border-[#555] transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color} mb-5`}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-[#e8e8e8] mb-2">{feature.title}</h3>
                <p className="text-[#888]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#2a2a3a] border border-[#3a3a4a] rounded-3xl p-12 md:p-16">
            <h2 className="chalk-title text-3xl md:text-4xl text-[#e8e8e8] mb-4 tracking-widest">
              Pronto para se organizar?
            </h2>
            <p className="chalk-text text-[#888] text-lg mb-8 max-w-xl mx-auto">
              Comece gratuitamente e transforme a forma como você planeja seu mês.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#f0c040] text-[#1e1e2e] px-8 py-3.5 rounded-xl font-bold hover:bg-[#f0c040]/90 transition-colors text-lg"
            >
              Criar minha conta
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#2a2a3a]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#f0c040] rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#1e1e2e]" />
            </div>
            <span className="font-semibold text-[#e8e8e8]">Plannerly</span>
          </div>
          <p className="text-sm text-[#555]">
            &copy; 2025 Plannerly. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
