import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken } from "../lib/api";
import { QuizEditor } from "../components/QuizEditor";

export const Route = createFileRoute("/quizzes/new")({
  head: () => ({ meta: [{ title: "New quiz — RapidQuiz" }] }),
  component: NewQuizPage,
});

function NewQuizPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getToken()) nav({ to: "/login" });
    else setReady(true);
  }, [nav]);
  if (!ready) return null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">New quiz</h1>
      <QuizEditor onSaved={() => nav({ to: "/dashboard" })} />
    </main>
  );
}
