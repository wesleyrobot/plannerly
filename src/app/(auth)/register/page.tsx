"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); setLoading(false); return; }
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Conta criada! Verifique seu email para confirmar.");
    router.push("/login");
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-[#1e1e2e] flex items-center justify-center p-4">
      <Toaster position="top-right" toastOptions={{ style: { background: "#2a2a3a", color: "#e8e8e8", border: "1px solid #3a3a4a" } }} />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#f0c040] rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#1e1e2e]" />
            </div>
            <h1 className="chalk-title text-2xl text-[#e8e8e8]">Plannerly</h1>
          </div>
          <p className="chalk-text text-[#888]">Organize seu mês. Visualize sua rotina.</p>
        </div>

        <div className="bg-[#2a2a3a] rounded-2xl border border-[#3a3a4a] p-8">
          <h2 className="chalk-title text-xl text-[#e8e8e8] mb-6">Criar sua conta</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-[#888] mb-1.5">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555]"
                  placeholder="Seu nome" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#888] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555]"
                  placeholder="seu@email.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#888] mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-[#1e1e2e] border border-[#3a3a4a] rounded-xl focus:ring-2 focus:ring-[#f0c040]/50 outline-none text-[#e8e8e8] placeholder-[#555]"
                  placeholder="Mínimo 6 caracteres" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888]">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#f0c040] text-[#1e1e2e] py-2.5 rounded-xl font-bold hover:bg-[#f0c040]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Criando conta...</>) : "Criar conta"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#3a3a4a]" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#2a2a3a] text-[#888]">ou continue com</span></div>
          </div>

          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-[#3a3a4a] rounded-xl hover:bg-white/5 transition-colors font-medium text-[#a0a0b0]">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="mt-6 text-center text-sm text-[#888]">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-[#f0c040] hover:text-[#f0c040]/80 font-medium">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
