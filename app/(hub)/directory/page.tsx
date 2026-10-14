import Link from "next/link";
import { Avatar } from "@/components/participant-profile";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCohort, getDirectory, requireParticipant } from "@/lib/data";

export default async function DirectoryPage() {
  const me = await requireParticipant();
  const cohort = me.home_cohort_id ? await getCohort(me.home_cohort_id) : null;
  const people = (await getDirectory()).filter(
    (p) => p.role !== "admin" || p.id === me.id,
  );

  return (
    <>
      <PageHeader
        title="Directory"
        lead={
          cohort
            ? `Everyone in ${cohort.name} — ${people.length} ${people.length === 1 ? "person" : "people"}. Click a name to read their profile.`
            : "You are not assigned to a cohort yet, so there is nobody to show."
        }
      />

      {people.length === 0 ? (
        <EmptyState>No one else has been added to your cohort yet.</EmptyState>
      ) : (
        <ul className="border-line bg-surface divide-line grid divide-y border sm:grid-cols-2 sm:divide-y-0">
          {people.map((person) => (
            <li key={person.id} className="border-line sm:border-b">
              <Link
                href={`/directory/${person.id}`}
                className="hover:bg-paper group flex items-center gap-4 px-4 py-3"
              >
                <Avatar person={person} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="group-hover:text-accent block text-sm font-bold">
                    {person.full_name}
                    {person.id === me.id ? (
                      <span className="text-muted font-normal"> (you)</span>
                    ) : null}
                  </span>
                  <span className="text-muted block truncate text-sm">
                    {person.company_name ?? "—"}
                  </span>
                </span>
                <span className="text-muted group-hover:text-accent text-lg" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
