import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-on-surface leading-none">
            La Rapaziada
          </h1>
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-primary-container mt-2">
            Music CRM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full bg-transparent border-b border-outline-variant/40 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
            />
          </div>

          <div>
            <label className="block text-[0.6rem] font-black uppercase tracking-[0.2em] text-primary-container mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-transparent border-b border-outline-variant/40 text-on-surface py-2 text-sm font-medium focus:outline-none focus:border-primary-container transition-colors placeholder:text-on-surface/20"
            />
          </div>

          {error && (
            <p className="text-[0.7rem] text-primary-container font-bold uppercase tracking-wide">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-primary-container to-on-primary-fixed-variant text-white py-4 font-black uppercase tracking-tighter text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
