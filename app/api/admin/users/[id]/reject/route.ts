import { performApprovalAction } from "@/lib/approvals";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  return performApprovalAction(params.id, "REJECT", body?.reason);
}
