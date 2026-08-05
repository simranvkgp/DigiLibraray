import { auth, signOut } from "@/lib/auth";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import type { Role } from "@/types";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session!.user as any;
  const lang = await getUserLanguage(user.id as string);

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-dvh bg-dash-cream">
      <DashboardTopBar
        name={session!.user!.name ?? ""}
        image={session!.user!.image}
        role={user.role as Role}
        lang={lang}
        onSignOut={handleSignOut}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
