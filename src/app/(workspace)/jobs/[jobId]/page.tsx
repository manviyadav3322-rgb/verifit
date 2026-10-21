import { JobsWorkspace } from "@/components/features/jobs-workspace";

export default async function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <JobsWorkspace kind="jobDetail" jobId={jobId} />;
}
