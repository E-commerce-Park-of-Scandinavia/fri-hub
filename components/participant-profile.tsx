import { Badge } from "@/components/ui";
import type { Participant } from "@/lib/types";

export const PROFILE_FIELDS: { key: keyof Participant; label: string }[] = [
  { key: "what_company_does", label: "What the company does" },
  { key: "why_started", label: "Why they started" },
  { key: "proud_of", label: "Proud of" },
  { key: "biggest_challenge", label: "Biggest challenge" },
  { key: "good_at", label: "Good at" },
  { key: "hope_to_get_from_group", label: "Hopes to get from the group" },
];

export function Avatar({
  person,
  size = 56,
}: {
  person: Participant;
  size?: number;
}) {
  if (person.photo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external/storage URLs
      <img
        src={person.photo_url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2.6 }}
      className="bg-accent-soft text-accent flex shrink-0 items-center justify-center font-extrabold"
    >
      {person.full_name.charAt(0)}
    </div>
  );
}

export function SocialLinks({ person }: { person: Participant }) {
  const links = [
    { href: person.company_website, label: "Website" },
    { href: person.instagram_url, label: "Instagram" },
    { href: person.tiktok_url, label: "TikTok" },
    { href: person.facebook_url, label: "Facebook" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  if (links.length === 0) return null;

  return (
    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent font-semibold underline"
        >
          {link.label}
        </a>
      ))}
    </p>
  );
}

export function ParticipantProfile({
  person,
  isMe = false,
}: {
  person: Participant;
  isMe?: boolean;
}) {
  const answered = PROFILE_FIELDS.filter(
    ({ key }) => typeof person[key] === "string" && person[key],
  );

  return (
    <article>
      <header className="border-line flex flex-wrap items-start gap-5 border-b pb-6">
        <Avatar person={person} size={96} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl">
            {person.full_name}
            {isMe ? (
              <span className="text-muted text-base font-normal"> (you)</span>
            ) : null}
          </h1>
          {person.company_name ? (
            <p className="text-muted mt-0.5 text-base">{person.company_name}</p>
          ) : null}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
            <a href={`mailto:${person.email}`} className="text-accent underline">
              {person.email}
            </a>
            {person.phone ? (
              <a
                href={`tel:${person.phone.replace(/\s+/g, "")}`}
                className="text-accent underline"
              >
                {person.phone}
              </a>
            ) : null}
          </p>
          {person.status === "alumni" ? (
            <p className="mt-2">
              <Badge>Alumni</Badge>
            </p>
          ) : null}
          <SocialLinks person={person} />
        </div>
      </header>

      {answered.length === 0 ? (
        <p className="text-muted mt-6 text-sm">
          {isMe
            ? "You have not filled in your profile yet — you can do that under My profile."
            : "This profile has not been filled in yet."}
        </p>
      ) : (
        <dl className="mt-6 space-y-6">
          {answered.map(({ key, label }) => (
            <div key={key}>
              <dt className="text-muted text-xs font-bold tracking-widest uppercase">
                {label}
              </dt>
              <dd className="prose-plain mt-1 text-sm">{person[key] as string}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
