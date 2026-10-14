import Link from "next/link";
import {
  Card,
  ExternalButtonLink,
  Notice,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import { getCohort, getProgramForCohort, requireParticipant } from "@/lib/data";

/** A link still holding seed text is worse than no link — it 404s silently. */
function isPlaceholder(url: string | null) {
  return url === null || url.includes("REPLACE-ME");
}

/**
 * Deliberately thin: Slack already works. This page is two links, not an
 * integration — no message sync, no embedding.
 */
export default async function CommunityPage() {
  const participant = await requireParticipant();
  const cohort = participant.home_cohort_id
    ? await getCohort(participant.home_cohort_id)
    : null;
  const program = await getProgramForCohort(participant.home_cohort_id);
  const isAdmin = participant.role === "admin";

  const channelUrl = isPlaceholder(cohort?.slack_channel_url ?? null)
    ? null
    : cohort!.slack_channel_url;
  const inviteUrl = isPlaceholder(program?.slack_invite_url ?? null)
    ? null
    : program!.slack_invite_url;

  return (
    <>
      <PageHeader
        title="Community"
        lead="The conversation lives in Slack. This is the door to it."
      />

      {isAdmin && (!channelUrl || !inviteUrl) ? (
        <div className="mb-6">
          <Notice tone="error">
            <strong>Admin:</strong> these links are not set yet, so participants
            see nothing useful here. Set the channel link per cohort under{" "}
            <Link href="/admin/cohorts" className="underline">
              Cohorts
            </Link>{" "}
            and the workspace invite under{" "}
            <Link href="/admin/programs" className="underline">
              Programmes
            </Link>
            . To get the channel link: open the channel in Slack, click its name,
            then <em>Copy link</em>.
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <SectionTitle>Your cohort channel</SectionTitle>
          {channelUrl ? (
            <>
              <p className="text-muted mb-4 text-sm">
                The private channel for {cohort?.name}. Day-to-day questions,
                session chatter and quick asks go here.
              </p>
              <ExternalButtonLink href={channelUrl}>
                Open {cohort?.name} in Slack
              </ExternalButtonLink>
            </>
          ) : (
            <Notice>
              No Slack channel link has been set for your cohort yet. Email{" "}
              <a className="underline" href="mailto:info@ecommercepark.se">
                info@ecommercepark.se
              </a>{" "}
              and you will be pointed to the right channel.
            </Notice>
          )}
        </Card>

        <Card>
          <SectionTitle>Not in the workspace yet?</SectionTitle>
          {inviteUrl ? (
            <>
              <p className="text-muted mb-4 text-sm">
                Join the E-commerce Park workspace first, then open your cohort
                channel.
              </p>
              <ExternalButtonLink href={inviteUrl} tone="secondary">
                Join the Slack workspace
              </ExternalButtonLink>
            </>
          ) : (
            <Notice>
              No workspace invite link has been set yet. Email{" "}
              <a className="underline" href="mailto:info@ecommercepark.se">
                info@ecommercepark.se
              </a>{" "}
              and you will be added by hand.
            </Notice>
          )}
        </Card>
      </div>
    </>
  );
}
