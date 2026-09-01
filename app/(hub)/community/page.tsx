import {
  Card,
  ExternalButtonLink,
  Notice,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import { getCohort, getProgramForCohort, requireParticipant } from "@/lib/data";

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

  const channelUrl = cohort?.slack_channel_url ?? null;
  const inviteUrl = program?.slack_invite_url ?? null;

  return (
    <>
      <PageHeader
        title="Community"
        lead="The conversation lives in Slack. This is the door to it."
      />

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
              No Slack channel link has been set for your cohort yet.
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
