import type { BriefDetails, BriefItem, QuizAnswers } from "@/lib/types";
import { uid } from "@/lib/utils";

export const SESSION_KEY = "drp28.frontend.sessionId";
export const ANSWERS_KEY = "drp28.frontend.answers";
export const BRIEF_KEY = "drp28.frontend.brief";
export const BRIEF_ID_KEY = "drp28.frontend.briefId";
export const BRIEF_DETAILS_KEY = "drp28.frontend.briefDetails";

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing can deny localStorage writes.
  }
}

export function getSessionId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = uid("session");
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

export function readAnswers(): QuizAnswers {
  return readStored<QuizAnswers>(ANSWERS_KEY, {});
}

export function writeAnswers(answers: QuizAnswers) {
  writeStored(ANSWERS_KEY, answers);
}

export function readBrief(): BriefItem[] {
  return readStored<BriefItem[]>(BRIEF_KEY, []);
}

export function writeBrief(items: BriefItem[]) {
  writeStored(BRIEF_KEY, items);
}

export function readBriefDetails(): BriefDetails {
  return readStored<BriefDetails>(BRIEF_DETAILS_KEY, {});
}

export function writeBriefDetails(details: BriefDetails) {
  writeStored(BRIEF_DETAILS_KEY, details);
}

export function readBriefId(): string | null {
  return readStored<string | null>(BRIEF_ID_KEY, null);
}

export function writeBriefId(id: string) {
  writeStored(BRIEF_ID_KEY, id);
}
