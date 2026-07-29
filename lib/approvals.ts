import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApprovalAction, ApprovalStatus } from "@/types";

const actionToStatus: Record<ApprovalAction, ApprovalStatus | null> = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  SUSPEND: "SUSPENDED",
  REACTIVATE: "APPROVED",
  DELETE: null, // handled separately — deletes the row
};

export async function performApprovalAction(
  targetUserId: string,
  action: ApprovalAction,
  reason?: string
) {
  const session = await auth();
  const actor = session?.user as any;
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "DELETE") {
    try {
      await prisma.user.delete({ where: { id: targetUserId } });
    } catch (err) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  const newStatus = actionToStatus[action];
  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: { approvalStatus: newStatus! },
  });

  await prisma.approval.create({
    data: { targetUserId, actorUserId: actor.id, action, reason },
  });

  return NextResponse.json({ success: true, user: updated });
}
