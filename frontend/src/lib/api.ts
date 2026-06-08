// API client for the RapidQuiz Go backend.
// Configure VITE_API_BASE_URL in a .env file (e.g. http://localhost:8080).

export const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:8080";

const TOKEN_KEY = "rq_token";
const USER_KEY = "rq_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
}
export function getStoredUser(): { name?: string; email?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setStoredUser(u: { name?: string; email?: string } | null) {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(USER_KEY, JSON.stringify(u));
  else window.localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function api<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export function wsUrl(roomCode: string): string {
  const u = new URL(API_BASE);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = `/ws/${roomCode}`;
  return u.toString();
}

// ---------- Types ----------
export interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  time_limit?: number;
}
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  created_by: string;
  questions: Question[];
  created_at?: string;
  updated_at?: string;
}
export interface GameSession {
  message?: string;
  room_code: string;
  game_id: string;
  status: string;
  currentQuestion: number;
}
export interface JoinResponse {
  message: string;
  participant_id: string;
  game_id: string;
}
export interface AnswerResponse {
  is_correct: boolean;
  score: number;
  message: string;
}
export interface LeaderboardEntry {
  rank: number;
  participant_id: string;
  name: string;
  score: number;
}
export interface LeaderboardResponse {
  game_id: string;
  leaderboard: LeaderboardEntry[];
}
