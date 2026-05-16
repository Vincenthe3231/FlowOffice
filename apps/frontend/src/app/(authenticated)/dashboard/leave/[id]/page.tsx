import { LeaveDetailView } from "@/features/leave/components/LeaveDetailView"

interface Props {
  params: Promise<{ id: string }>
}

export default async function LeaveDetailPage({ params }: Props) {
  const { id } = await params
  const leaveId = parseInt(id, 10)
  return <LeaveDetailView leaveId={leaveId} />
}
