import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getStoredUser, getToken, setStoredUser, setToken } from "../lib/api";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find that page.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >Try again</button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RapidQuiz — Real-time multiplayer quizzes" },
      { name: "description", content: "Host and play live quiz games with friends in real time." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Nav() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  useEffect(() => {
    setAuthed(!!getToken());
    setUser(getStoredUser());
    const onStorage = () => {
      setAuthed(!!getToken());
      setUser(getStoredUser());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("rq-auth", onStorage as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rq-auth", onStorage as any);
    };
  }, []);
  function logout() {
    setToken(null);
    setStoredUser(null);
    window.dispatchEvent(new Event("rq-auth"));
    navigate({ to: "/" });
  }
  return (
    <header className="border-b border-border/60 backdrop-blur-sm bg-background/60 sticky top-0 z-40">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-2 px-3 sm:px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-base sm:text-lg shrink-0">
          <span className="inline-block h-7 w-7 rounded-lg" style={{ background: "var(--gradient-hero)" }} />
          RapidQuiz
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap justify-end">
          <Link to="/join" className="px-2 sm:px-3 py-1.5 rounded-md hover:bg-secondary">Join</Link>
          {authed ? (
            <>
              <Link to="/dashboard" className="px-2 sm:px-3 py-1.5 rounded-md hover:bg-secondary">My quizzes</Link>
              <span className="text-muted-foreground hidden md:inline truncate max-w-[160px]">{user?.name || user?.email}</span>
              <button onClick={logout} className="px-2 sm:px-3 py-1.5 rounded-md border border-border hover:bg-secondary">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-2 sm:px-3 py-1.5 rounded-md hover:bg-secondary">Log in</Link>
              <Link to="/register" className="px-2 sm:px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Nav />
      <Outlet />
    </QueryClientProvider>
  );
}

// re-export some hooks for child routes convenience
export { useQuery, useMutation, useQueryClient };
