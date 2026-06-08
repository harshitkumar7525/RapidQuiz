import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken } from "../lib/api";
import { QuizEditor } from "../components/QuizEditor";

export const Route = createFileRoute("/quizzes/$quizId/edit")({
  head: () => ({ meta: [{ title: "Edit quiz — RapidQuiz" }] }),
  component: EditQuizPage,
});

function EditQuizPage() {
  const nav = useNavigate();
  const { quizId } = Route.useParams();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getToken()) nav({ to: "/login" });
    else setReady(true);
  }, [nav]);
  if (!ready) return null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Edit quiz</h1>
      <QuizEditor quizId={quizId} onSaved={() => nav({ to: "/dashboard" })} />
    </main>
  );
}
