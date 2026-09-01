import { AppShell } from "@/components/app-shell";
import { getCohort, requireParticipant } from "@/lib/data";
import type { NavItem } from "@/components/nav";

const BASE_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/directory", label: "Directory" },
  { href: "/knowledge-hub", label: "Knowledge Hub" },
  { href: "/focus-circle", label: "Focus Circle" },
  { href: "/community", label: "Community" },
  { href: "/profile", label: "My profile" },
];

export default async function HubLayout({ children }: LayoutProps<"/">) {
  const participant = await requireParticipant();
  const cohort = participant.home_cohort_id
    ? await getCohort(participant.home_cohort_id)
    : null;

  const items =
    participant.role === "admin"
      ? [...BASE_ITEMS, { href: "/admin/participants", label: "Admin" }]
      : BASE_ITEMS;

  return (
    <AppShell
      participant={participant}
      cohortName={cohort?.name ?? null}
      items={items}
    >
      {children}
    </AppShell>
  );
}
