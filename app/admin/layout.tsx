import { AppShell } from "@/components/app-shell";
import { getCohort, requireAdmin } from "@/lib/data";
import type { NavItem } from "@/components/nav";

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/knowledge-hub", label: "Knowledge Hub" },
  { href: "/admin/cohorts", label: "Cohorts" },
  { href: "/admin/programs", label: "Programmes" },
  { href: "/admin/checkins", label: "Check-ins" },
  { href: "/", label: "← Participant view" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const participant = await requireAdmin();
  const cohort = participant.home_cohort_id
    ? await getCohort(participant.home_cohort_id)
    : null;

  return (
    <AppShell
      participant={participant}
      cohortName={cohort?.name ?? null}
      items={ADMIN_ITEMS}
      eyebrow="Admin"
    >
      {children}
    </AppShell>
  );
}
