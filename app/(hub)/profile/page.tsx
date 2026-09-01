import ProfileForm from "./profile-form";
import { PageHeader } from "@/components/ui";
import { requireParticipant } from "@/lib/data";

export default async function ProfilePage() {
  const participant = await requireParticipant();

  return (
    <>
      <PageHeader
        title="My profile"
        lead={`Signed in as ${participant.email}. Contact Sylvia to change your email or cohort.`}
      />
      <ProfileForm participant={participant} />
    </>
  );
}
