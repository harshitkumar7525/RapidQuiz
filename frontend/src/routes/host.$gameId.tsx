import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, wsUrl, type LeaderboardResponse } from "../lib/api";
import { Styles } from "./login";

export const Route = createFileRoute("/host/$gameId")({
  head: () => ({ meta: [{ title: "Host game — RapidQuiz" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ code: (s.code as string) || "" }),
  component: HostPage,
});

function HostPage() {
  const { gameId } = Route.useParams();
  const { code } = Route.useSearch();
  const [events, setEvents] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!code) return;
    const ws = new WebSocket(wsUrl(code));
    wsRef.current = ws;
    ws.onmessage = (e) => setEvents((ev) => [...ev.slice(-50), String(e.data)]);
    ws.onclose = () => setEvents((ev) => [...ev, "[connection closed]"]);
    return () => ws.close();
  }, [code]);

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard", gameId],
    queryFn: () => api<LeaderboardResponse>(`/games/${gameId}/leaderboard`),
    refetchInterval: 2000,
  });

  function broadcast(type: string, payload?: any) {
    wsRef.current?.send(JSON.stringify({ type, data: payload ?? null }));
  }

  function copyCode() {
    navigator.clipboard?.writeText(code);
  }

  return (
    <main className="mx-auto max-w-5xl px-3 sm:px-4 py-6 sm:py-10 grid gap-6 lg:grid-cols-[1fr,360px]">
      <div className="space-y-6">
        <div className="card text-center">
          <div className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground">Room code</div>
          <div
            className="mt-2 text-4xl sm:text-6xl font-extrabold font-mono tracking-[0.2em] sm:tracking-[0.3em] cursor-pointer break-all"
            onClick={copyCode}
            title="Click to copy"
            style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", color: "transparent" }}
          >
            {code || "------"}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Tap to copy · share with players</p>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Host controls</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Broadcast messages to all connected players via the WebSocket room.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => broadcast("start")}>Start</button>
            <button className="btn-secondary" onClick={() => broadcast("next")}>Next question</button>
            <button className="btn-secondary" onClick={() => broadcast("pause")}>Pause</button>
            <button className="btn-ghost text-destructive" onClick={() => broadcast("end")}>End</button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Live events</h3>
          <div className="bg-black/30 rounded-lg p-3 max-h-64 overflow-auto font-mono text-xs space-y-1">
            {events.length === 0 && <div className="text-muted-foreground">Waiting for activity…</div>}
            {events.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        </div>
      </div>

      <aside className="card">
        <h3 className="font-semibold mb-4">Leaderboard</h3>
        <ol className="space-y-2">
          {leaderboard?.leaderboard?.length ? leaderboard.leaderboard.map((p) => (
            <li key={p.participant_id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
              <span className="flex items-center gap-3">
                <span className="font-mono text-accent">#{p.rank}</span>
                <span className="font-medium">{p.name}</span>
              </span>
              <span className="font-mono font-semibold">{p.score}</span>
            </li>
          )) : <p className="text-sm text-muted-foreground">No scores yet.</p>}
        </ol>
      </aside>
      <Styles />
    </main>
  );
}
