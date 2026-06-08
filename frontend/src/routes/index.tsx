import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RapidQuiz — Real-time multiplayer quizzes" },
      { name: "description", content: "Create quizzes, share a room code, and play in real time with friends." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-24">
      <section className="text-center">
        <span className="inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          Live · Multiplayer · Free
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-extrabold leading-tight tracking-tight">
          Quiz battles,{" "}
          <span style={{ background: "var(--gradient-hero)", WebkitBackgroundClip: "text", color: "transparent" }}>
            in real time.
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Build a quiz, share a room code, and watch the live leaderboard light up
          as everyone races to answer.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            Create a quiz
          </Link>
          <Link to="/join" className="px-6 py-3 rounded-lg border border-border font-semibold hover:bg-secondary">
            Join with code
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          { t: "Build", d: "Compose questions with multiple choices and time limits." },
          { t: "Host", d: "Generate a room code and start a live session." },
          { t: "Compete", d: "Players answer in real time and climb the leaderboard." },
        ].map((c) => (
          <div key={c.t} className="rounded-2xl p-6 border border-border" style={{ background: "var(--gradient-card)" }}>
            <div className="text-sm text-accent font-mono uppercase tracking-widest">{c.t}</div>
            <p className="mt-3 text-base">{c.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
