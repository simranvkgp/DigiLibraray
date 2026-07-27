import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validations";
import { sendPushToAdmins } from "@/lib/push";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { mobileNumber, institutionName, city, state, idCardUrl } = parsed.data;

  let institution = await prisma.institution.findFirst({ where: { name: institutionName } });
  if (!institution) {
    institution = await prisma.institution.create({ data: { name: institutionName, city, state } });
  }

  const updated = await prisma.user.update({
    where: { id: (session.user as any).id },
    data: {
      mobileNumber,
      institutionId: institution.id,
      city,
      state,
      idCardUrl,
      approvalStatus: "PENDING",
    },
  });

  await prisma.activityLog.create({
    data: { userId: updated.id, action: "REGISTER" },
  });

  sendPushToAdmins(
    "New user registration",
    `${updated.name} (${updated.email}) is awaiting approval`,
    "/admin/users"
  ).catch(() => {});

  return NextResponse.json({ success: true, approvalStatus: updated.approvalStatus });
}
