"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Eye, EyeOff, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success("Login realizado com sucesso!");
    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-[#1e1e2e] flex items-center justify-center p-4">
      <Toaster position="top-right" toastOptions={{ style: { background: "#2a2a3a", color: "#e8e8e8", border: "1px solid #3a3a4a" } }} />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#f0c040] rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#1e1e2e]" />
            </div>
            <h1 className="chalk-title text-2xl text-[#e8e8e8]">Plannerly</h1>
          </Link>
          <p className="chalk-text text-[#888]">Organize seu mês. Visualize sua rotina.</p>
        </div>

        {/* Brutalist Card */}
        <div
          className="relative bg-gradient-to-br from-[#f0c040] to-[#d4a020] border-4 border-[#111] overflow-hidden"
          style={{ boxShadow: "8px 8px 0 #111, 16px 16px 0 rgba(240,192,64,0.25)" }}
        >
          {/* Corner triangle */}
          <div
            className="absolute -top-[1px] -right-[1px] w-6 h-6 bg-[#111] z-10"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
          />

          {/* Header */}
          <div className="bg-[#111]/15 px-8 py-5 border-b-4 border-[#111]">
            <h2
              className="text-[#111] font-extrabold text-xl uppercase tracking-[3px] text-center"
              style={{ textShadow: "2px 2px 0 rgba(255,255,255,0.15)" }}
            >
              Login
            </h2>
          </div>

          {/* Form body */}
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[#111] font-bold text-xs uppercase tracking-wider mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border-[3px] border-[#111] font-bold text-[#111] placeholder-[#111]/40 focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] transition-transform"
                  style={{ boxShadow: "4px 4px 0 #111" }}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[#111] font-bold text-xs uppercase tracking-wider mb-2">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/80 border-[3px] border-[#111] font-bold text-[#111] placeholder-[#111]/40 focus:outline-none focus:translate-x-[2px] focus:translate-y-[2px] transition-transform"
                    style={{ boxShadow: "4px 4px 0 #111" }}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#111]/50 hover:text-[#111]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#111] text-[#f0c040] font-extrabold uppercase tracking-[2px] cursor-pointer hover:bg-[#222] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ boxShadow: "4px 4px 0 rgba(255,255,255,0.15)" }}
              >
                {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Entrando...</>) : "ENTRAR"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#111]/25" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#c99a1d] text-[#111] font-bold uppercase text-xs tracking-wider">ou</span>
              </div>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 bg-white/90 border-[3px] border-[#111] font-bold text-[#111] uppercase tracking-wider text-sm cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              style={{ boxShadow: "4px 4px 0 #111" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <p className="mt-6 text-center text-sm text-[#111]/60 font-medium">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-[#111] font-extrabold underline underline-offset-2 hover:no-underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
