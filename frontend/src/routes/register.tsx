import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api, setStoredUser, setToken } from "../lib/api";
import { Field, Styles } from "./login";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Sign up — RapidQuiz" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      setToken(res.token);
      setStoredUser({ name, email });
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
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-muted-foreground mt-1">Start building quizzes in seconds.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
        </Field>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <button disabled={loading} className="btn-primary w-full">{loading ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Already have one? <Link to="/login" className="text-accent underline">Log in</Link>
      </p>
      <Styles />
    </main>
  );
}
