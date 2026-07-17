import { performApprovalAction } from "@/lib/approvals";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return performApprovalAction(params.id, "DELETE");
}
