import { AssessmentResultView } from "@/components/features/assessment-result-view";

export default async function AssessmentResultPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  return <AssessmentResultView assessmentId={id} />;
}
