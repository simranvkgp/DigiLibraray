import { prisma } from "@/lib/prisma";
import type { Lang } from "./translate";

export async function getUserLanguage(userId: string | undefined | null): Promise<Lang> {
  if (!userId) return "en";
  const setting = await prisma.setting.findUnique({ where: { userId }, select: { language: true } });
  return setting?.language === "hi" ? "hi" : "en";
}
