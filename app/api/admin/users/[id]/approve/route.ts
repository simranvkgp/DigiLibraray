import { performApprovalAction } from "@/lib/approvals";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return performApprovalAction(params.id, "APPROVE");
}
