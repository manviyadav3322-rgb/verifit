import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoadmapBoard } from "@/components/features/roadmap-board";
import { PageTitle } from "@/components/ui/primitives";

export default function RoadmapPage() {
  return <><PageTitle eyebrow="Evidence plan" title="Close your gaps" description="The smallest set of verifiable actions that can improve your evidence." action={<Link href="/dashboard" className="button button-outline button-sm"><ArrowLeft size={13} /> Dashboard</Link>} /><RoadmapBoard /></>;
}
