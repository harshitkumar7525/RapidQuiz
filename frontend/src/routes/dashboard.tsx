import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getToken, type Quiz } from "../lib/api";
import { Styles } from "./login";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Quizzes — RapidQuiz" }] }),
  component: Dashboard,
});

function Dashboard() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!getToken()) nav({ to: "/login" });
    else setReady(true);
  }, [nav]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-quizzes"],
    enabled: ready,
    queryFn: () => api<Quiz[]>("/quizzes/", { auth: true }),
  });

  async function startGame(quizId: string) {
    try {
      const res = await api<{ game_id: string; room_code: string }>("/games/create", {
        method: "POST",
        auth: true,
        body: { quiz_id: quizId },
      });
      nav({ to: "/host/$gameId", params: { gameId: res.game_id }, search: { code: res.room_code } });
    } catch (e: any) {
      setDeleteError(e.message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/quizzes/${deleteTarget.id}`, { method: "DELETE", auth: true });
      setDeleteTarget(null);
      refetch();
    } catch (e: any) {
      setDeleteError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <Link to="/quizzes/new" className="btn-primary">+ New quiz</Link>
      </div>

      {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
      {error && <p className="mt-8 text-destructive">{(error as Error).message}</p>}
      {deleteError && <p className="mt-4 text-destructive text-sm">{deleteError}</p>}

      {data && data.length === 0 && (
        <div className="mt-12 card text-center">
          <p className="text-muted-foreground">You haven't created any quizzes yet.</p>
          <Link to="/quizzes/new" className="inline-block mt-4 btn-primary">Create your first quiz</Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data?.map((q) => (
          <div key={q.id} className="card flex flex-col">
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{q.title}</h3>
              {q.description && <p className="text-sm text-muted-foreground mt-1">{q.description}</p>}
              <p className="text-xs text-muted-foreground mt-3">{q.questions?.length || 0} questions</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => startGame(q.id)} className="btn-primary">Start game</button>
              <Link to="/quizzes/$quizId/edit" params={{ quizId: q.id }} className="btn-secondary">Edit</Link>
              <button
                onClick={() => { setDeleteError(null); setDeleteTarget(q); }}
                className="btn-ghost text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* React-based confirmation dialog — replaces window.confirm() which is
          silently blocked in sandboxed iframes (e.g. Lovable preview) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-destructive text-sm px-1">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Styles />
    </main>
  );
}