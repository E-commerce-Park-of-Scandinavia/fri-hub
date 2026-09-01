export type IntakeSeason = "spring" | "autumn";
export type CohortStatus = "active" | "alumni" | "closed";
export type ParticipantRole = "participant" | "admin";
export type ParticipantStatus = "active" | "alumni";
export type SessionStatus = "draft" | "confirmed";

export type SessionType =
  | "lecture_workshop"
  | "co_working"
  | "company_visit"
  | "alumni_day"
  | "hackathon";

export type KnowledgeCategory =
  | "session_materials"
  | "expert_briefs"
  | "program_plan"
  | "session_summaries"
  | "general";

export type QuestionnaireType = "intake" | "feedback" | "site_review" | "custom";

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  lecture_workshop: "Lecture & workshop",
  co_working: "Co-working",
  company_visit: "Company visit",
  alumni_day: "Alumni day",
  hackathon: "Hackathon",
};

export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  session_materials: "Session materials",
  expert_briefs: "Expert briefs",
  program_plan: "Programme plan",
  session_summaries: "Session summaries",
  general: "General",
};

export type AgendaBlock = {
  start_time: string | null;
  end_time: string | null;
  label: string;
  description: string | null;
};

export type Program = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  slack_invite_url: string | null;
};

export type Cohort = {
  id: string;
  program_id: string;
  name: string;
  intake_season: IntakeSeason;
  start_date: string | null;
  expected_end_date: string | null;
  status: CohortStatus;
  slack_channel_url: string | null;
};

export type Participant = {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  company_name: string | null;
  company_website: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  photo_url: string | null;
  home_cohort_id: string | null;
  role: ParticipantRole;
  status: ParticipantStatus;
  what_company_does: string | null;
  why_started: string | null;
  proud_of: string | null;
  biggest_challenge: string | null;
  good_at: string | null;
  hope_to_get_from_group: string | null;
};

export type Session = {
  id: string;
  program_id: string;
  date: string;
  session_type: SessionType;
  title: string;
  speaker_name: string | null;
  speaker_bio: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  slides_url: string | null;
  status: SessionStatus;
  agenda_blocks: AgendaBlock[];
};

export type KnowledgeHubItem = {
  id: string;
  program_id: string;
  cohort_id: string | null;
  session_id: string | null;
  category: KnowledgeCategory;
  title: string;
  drive_url: string;
  item_date: string | null;
};

export type FocusCircleCheckin = {
  id: string;
  participant_id: string;
  session_id: string;
  look_back_notes: string | null;
  focus_next_two_weeks: string | null;
  committed_goal: string | null;
  submitted_at: string;
};

export type QuestionnaireQuestion = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  options?: string[];
};

export type Questionnaire = {
  id: string;
  program_id: string;
  title: string;
  type: QuestionnaireType;
  questions: QuestionnaireQuestion[];
  is_open: boolean;
};

export type QuestionnaireResponse = {
  id: string;
  questionnaire_id: string;
  participant_id: string;
  answers: Record<string, string>;
  submitted_at: string;
};
