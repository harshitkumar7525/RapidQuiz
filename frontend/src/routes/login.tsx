import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api, setStoredUser, setToken } from "../lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — RapidQuiz" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string; message: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(res.token);
      setStoredUser({ email });
      window.dispatchEvent(new Event("rq-auth"));
      nav({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-1">Log in to manage your quizzes.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </Field>
        <Field label="Password">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </Field>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <button disabled={loading} className="btn-primary w-full">{loading ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        No account? <Link to="/register" className="text-accent underline">Create one</Link>
      </p>
      <Styles />
    </main>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function Styles() {
  return (
    <style>{`
      .input { width:100%; padding:0.6rem 0.8rem; border-radius:0.6rem; background:var(--color-input); color:var(--color-foreground); border:1px solid var(--color-border); outline:none; }
      .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 30%, transparent); }
      .btn-primary { background:var(--color-primary); color:var(--color-primary-foreground); padding:0.65rem 1rem; border-radius:0.65rem; font-weight:600; }
      .btn-primary:disabled { opacity:0.6; }
      .btn-secondary { background:var(--color-secondary); color:var(--color-secondary-foreground); padding:0.6rem 1rem; border-radius:0.65rem; font-weight:500; border:1px solid var(--color-border); }
      .btn-ghost { padding:0.5rem 0.8rem; border-radius:0.6rem; }
      .btn-ghost:hover { background:var(--color-secondary); }
      .card { background:var(--gradient-card); border:1px solid var(--color-border); border-radius:1rem; padding:1.25rem; }
    `}</style>
  );
}
