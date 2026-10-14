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
        <ul className="border-line bg-surface divide-line divide-y border">
          {people.map((person) => (
            <li
              key={person.id}
              className="hover:bg-paper flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              {/* The row links to the profile; the contact links must sit
                  outside it, since an anchor cannot contain another anchor. */}
              <Link
                href={`/directory/${person.id}`}
                className="group flex min-w-0 flex-1 items-center gap-4"
              >
                <Avatar person={person} size={44} />
                <span className="min-w-0">
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
              </Link>

              <span className="flex min-w-0 flex-col items-start gap-0.5 text-sm sm:items-end">
                <a
                  href={`mailto:${person.email}`}
                  className="text-accent max-w-full truncate underline"
                >
                  {person.email}
                </a>
                {person.phone ? (
                  <a href={`tel:${person.phone.replace(/\s+/g, "")}`} className="text-muted">
                    {person.phone}
                  </a>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
