import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { getCohort, getDirectory, requireParticipant } from "@/lib/data";
import type { Participant } from "@/lib/types";

const PROFILE_FIELDS: { key: keyof Participant; label: string }[] = [
  { key: "what_company_does", label: "What the company does" },
  { key: "why_started", label: "Why they started" },
  { key: "proud_of", label: "Proud of" },
  { key: "biggest_challenge", label: "Biggest challenge" },
  { key: "good_at", label: "Good at" },
  { key: "hope_to_get_from_group", label: "Hopes to get from the group" },
];

function SocialLinks({ person }: { person: Participant }) {
  const links = [
    { href: person.company_website, label: "Website" },
    { href: person.instagram_url, label: "Instagram" },
    { href: person.tiktok_url, label: "TikTok" },
    { href: person.facebook_url, label: "Facebook" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  if (links.length === 0) return null;

  return (
    <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent underline"
        >
          {link.label}
        </a>
      ))}
    </p>
  );
}

export default async function DirectoryPage() {
  const me = await requireParticipant();
  const cohort = me.home_cohort_id ? await getCohort(me.home_cohort_id) : null;
  const people = (await getDirectory()).filter((p) => p.role !== "admin" || p.id === me.id);

  return (
    <>
      <PageHeader
        title="Directory"
        lead={
          cohort
            ? `Everyone in ${cohort.name}. Other cohorts keep their own directory, even when you share a session.`
            : "You are not assigned to a cohort yet, so there is nobody to show."
        }
      />

      {people.length === 0 ? (
        <EmptyState>No one else has been added to your cohort yet.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {people.map((person) => (
            <Card key={person.id}>
              <div className="flex items-start gap-4">
                {person.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- photos are arbitrary external URLs
                  <img
                    src={person.photo_url}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-accent-soft text-accent flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
                    {person.full_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-medium">
                    {person.full_name}
                    {person.id === me.id ? (
                      <span className="text-muted text-sm font-normal"> (you)</span>
                    ) : null}
                  </h2>
                  {person.company_name ? (
                    <p className="text-muted text-sm">{person.company_name}</p>
                  ) : null}
                  <p className="mt-1">
                    <a
                      href={`mailto:${person.email}`}
                      className="text-accent text-sm underline"
                    >
                      {person.email}
                    </a>
                  </p>
                  {person.status === "alumni" ? (
                    <p className="mt-2">
                      <Badge>Alumni</Badge>
                    </p>
                  ) : null}
                  <SocialLinks person={person} />
                </div>
              </div>

              <dl className="border-line mt-4 space-y-3 border-t pt-4">
                {PROFILE_FIELDS.map(({ key, label }) => {
                  const value = person[key];
                  if (!value || typeof value !== "string") return null;
                  return (
                    <div key={key}>
                      <dt className="text-muted text-xs font-semibold tracking-wide uppercase">
                        {label}
                      </dt>
                      <dd className="prose-plain mt-0.5 text-sm">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
