import MyOfferForm from "./my-offer-form";
import { BenefitCard } from "@/components/benefit-card";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { getBenefits, getDirectory, isExpired, requireParticipant } from "@/lib/data";

export default async function BenefitsPage() {
  const participant = await requireParticipant();
  const [benefits, directory] = await Promise.all([getBenefits(), getDirectory()]);

  // Only people in your own cohort are readable, so an offer from the other
  // cohort shows its company name without a person's name attached.
  const nameById = new Map(directory.map((p) => [p.id, p.full_name]));

  const live = benefits.filter((b) => !isExpired(b));
  const expired = benefits.filter(isExpired);

  const partner = live.filter((b) => b.kind === "partner");
  const peer = live.filter((b) => b.kind === "peer");
  const mine = benefits.filter(
    (b) => b.offered_by_participant_id === participant.id,
  );

  return (
    <>
      <PageHeader
        title="Member benefits"
        lead="Discounts and access from our partners, and from each other. Codes are for people in the programme — please keep them here."
      />

      <section className="mb-10">
        <SectionTitle>From our partners</SectionTitle>
        {partner.length === 0 ? (
          <EmptyState>No partner benefits have been added yet.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {partner.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionTitle>From the group</SectionTitle>
        {peer.length === 0 ? (
          <EmptyState>
            Nobody has offered anything yet. You could be the first — the form is
            below.
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {peer.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                offeredByName={
                  benefit.offered_by_participant_id
                    ? nameById.get(benefit.offered_by_participant_id)
                    : null
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <MyOfferForm participant={participant} existing={mine} />
      </section>

      {expired.length > 0 ? (
        <section>
          <SectionTitle>Ended</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {expired.map((benefit) => (
              <BenefitCard key={benefit.id} benefit={benefit} expired />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
