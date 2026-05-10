import { LeaveDetailView } from "@/features/leave/components/LeaveDetailView"

interface Props {
  params: { id: string }
}

export default function LeaveDetailPage({ params }: Props) {
  const leaveId = parseInt(params.id, 10)
  return <LeaveDetailView leaveId={leaveId} />
}
