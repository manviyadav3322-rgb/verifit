import { PageTitle } from "@/components/ui/primitives";
import { ProfileEditor } from "@/components/features/profile-editor";

export default function ProfilePage() {
  return <><PageTitle eyebrow="Your information" title="Profile" description="Keep the source information behind your eligibility and skill evidence up to date." /><ProfileEditor /></>;
}
