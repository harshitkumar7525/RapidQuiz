import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api, type JoinResponse } from "../lib/api";
import { Field, Styles } from "./login";

export const Route = createFileRoute("/join")({
  head: () => ({ meta: [{ title: "Join a game — RapidQuiz" }] }),
  component: JoinPage,
});

function JoinPage() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<JoinResponse>("/games/join", {
        method: "POST",
        body: { room_code: code.trim().toUpperCase(), name: name.trim() },
      });
      // store participant info for the play page
      sessionStorage.setItem(
        `rq_player_${res.game_id}`,
        JSON.stringify({ participant_id: res.participant_id, name, room_code: code.trim().toUpperCase() }),
      );
      nav({ to: "/play/$gameId", params: { gameId: res.game_id } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">Join a game</h1>
      <p className="text-muted-foreground mt-1">Enter the room code from your host.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Room code">
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="input font-mono tracking-[0.5em] text-center text-2xl"
            placeholder="A1B2C3"
          />
        </Field>
        <Field label="Your display name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <button disabled={loading} className="btn-primary w-full">{loading ? "Joining…" : "Join game"}</button>
      </form>
      <Styles />
    </main>
  );
}
