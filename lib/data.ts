import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { daysBetween, todayIso } from "@/lib/format";
import type {
  Cohort,
  KnowledgeHubItem,
  Participant,
  Program,
  Session,
} from "@/lib/types";

/** How long after a session its Focus Circle check-in stays open. */
const CHECKIN_WINDOW_DAYS = 7;

/**
 * The signed-in person's participant row. Cached per request so a page that
 * needs it in three places still only asks the database once.
 */
export const getCurrentParticipant = cache(
  async (): Promise<Participant | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("participants")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    return (data as Participant | null) ?? null;
  },
);

/**
 * Signed in with a real Supabase user but no participants row means the invite
 * flow was bypassed, or the row was deleted. There is nothing to show them.
 */
export async function requireParticipant(): Promise<Participant> {
  const participant = await getCurrentParticipant();
  if (!participant) redirect("/login?error=no-participant");
  return participant;
}

export async function requireAdmin(): Promise<Participant> {
  const participant = await requireParticipant();
  if (participant.role !== "admin") redirect("/");
  return participant;
}

export const getCohort = cache(async (id: string): Promise<Cohort | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cohorts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Cohort | null) ?? null;
});

export const getProgramForCohort = cache(
  async (cohortId: string | null): Promise<Program | null> => {
    if (!cohortId) return null;
    const cohort = await getCohort(cohortId);
    if (!cohort) return null;

    const supabase = await createClient();
    const { data } = await supabase
      .from("programs")
      .select("*")
      .eq("id", cohort.program_id)
      .maybeSingle();
    return (data as Program | null) ?? null;
  },
);

/**
 * Every session this participant's home cohort attends, oldest first.
 * RLS does the filtering — a session not linked to their cohort simply is not here.
 */
export async function getMySessions(): Promise<Session[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: true });
  return (data as Session[] | null) ?? [];
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Session | null) ?? null;
}

export function splitSessionsByDate(sessions: Session[]) {
  const today = todayIso();
  const upcoming = sessions.filter((s) => s.date >= today);
  const past = sessions.filter((s) => s.date < today).reverse();
  return { upcoming, past, next: upcoming[0] ?? null };
}

/** Sessions grouped under a month heading, in calendar order. */
export function groupSessionsByMonth(sessions: Session[]) {
  const groups = new Map<string, Session[]>();
  for (const session of sessions) {
    const key = session.date.slice(0, 7);
    const bucket = groups.get(key);
    if (bucket) bucket.push(session);
    else groups.set(key, [session]);
  }
  return [...groups.entries()].map(([month, items]) => ({ month, items }));
}

function hasFocusCircle(session: Session) {
  return (session.agenda_blocks ?? []).some((block) =>
    block.label?.toLowerCase().includes("focus circle"),
  );
}

/**
 * The session whose Focus Circle check-in is currently open: the most recent one
 * that has already happened, within the last week, that actually held a Focus
 * Circle. Returns null on a co-working week, which is the common case.
 */
export async function getOpenCheckinSession(): Promise<Session | null> {
  const today = todayIso();
  const sessions = await getMySessions();
  const candidates = sessions
    .filter(
      (s) =>
        hasFocusCircle(s) &&
        s.date <= today &&
        daysBetween(s.date, today) <= CHECKIN_WINDOW_DAYS,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return candidates[0] ?? null;
}

export async function getMyCheckins() {
  const participant = await requireParticipant();
  const supabase = await createClient();
  const { data } = await supabase
    .from("focus_circle_checkins")
    .select("*")
    .eq("participant_id", participant.id)
    .order("submitted_at", { ascending: false });
  return data ?? [];
}

export async function getDirectory(): Promise<Participant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("participants")
    .select("*")
    .order("full_name", { ascending: true });
  return (data as Participant[] | null) ?? [];
}

export async function getKnowledgeHubItems(): Promise<KnowledgeHubItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_hub_items")
    .select("*")
    .order("item_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data as KnowledgeHubItem[] | null) ?? [];
}

export async function getKnowledgeItemsForSession(
  sessionId: string,
): Promise<KnowledgeHubItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_hub_items")
    .select("*")
    .eq("session_id", sessionId)
    .order("title", { ascending: true });
  return (data as KnowledgeHubItem[] | null) ?? [];
}
