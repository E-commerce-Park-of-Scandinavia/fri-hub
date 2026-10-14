import Link from "next/link";
import { notFound } from "next/navigation";
import { ParticipantProfile } from "@/components/participant-profile";
import { getDirectory, requireParticipant } from "@/lib/data";

export default async function ParticipantPage({
  params,
}: PageProps<"/directory/[id]">) {
  const { id } = await params;
  const me = await requireParticipant();

  // Row Level Security already limits this list to the caller's own cohort, so
  // looking the person up inside it is also the permission check.
  const people = await getDirectory();
  const person = people.find((p) => p.id === id);
  if (!person) notFound();

  const visible = people.filter((p) => p.role !== "admin" || p.id === me.id);
  const index = visible.findIndex((p) => p.id === person.id);
  const previous = index > 0 ? visible[index - 1] : null;
  const next = index >= 0 && index < visible.length - 1 ? visible[index + 1] : null;

  return (
    <>
      <Link href="/directory" className="text-muted mb-6 inline-block text-sm underline">
        ← Back to directory
      </Link>

      <ParticipantProfile person={person} isMe={person.id === me.id} />

      {previous || next ? (
        <nav className="border-line mt-10 flex justify-between gap-4 border-t pt-4 text-sm">
          {previous ? (
            <Link href={`/directory/${previous.id}`} className="text-accent underline">
              ← {previous.full_name}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/directory/${next.id}`} className="text-accent underline">
              {next.full_name} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
