import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { ApprovalStatus, Role } from "@/types";

// NOTE: No email/password provider — Google OAuth only, per spec.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Only pull the fields the spec asks for: name, email, profile picture.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  // JWT (not database) sessions: Next.js Middleware runs on the Edge runtime,
  // where Prisma Client can't execute queries. Database-strategy sessions need
  // a Prisma lookup on every request (including middleware), which crashes
  // there. JWT sessions are decoded from the cookie with no DB call, so
  // middleware stays edge-safe; fresh role/approval data is pulled from the
  // DB only at sign-in and on an explicit session `update()` trigger.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            approvalStatus: true,
            categoryId: true,
            categoryLocked: true,
            boardId: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.approvalStatus = dbUser.approvalStatus;
          token.categoryId = dbUser.categoryId;
          token.categoryLocked = dbUser.categoryLocked;
          token.boardId = dbUser.boardId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as Role;
        (session.user as any).approvalStatus = token.approvalStatus as ApprovalStatus;
        (session.user as any).categoryId = token.categoryId as string | null;
        (session.user as any).categoryLocked = token.categoryLocked as boolean;
        (session.user as any).boardId = token.boardId as string | null;
      }
      return session;
    },
    async signIn({ user }) {
      // Track last login for the "Last Login" column in User Management,
      // and log the event for the daily-logins analytics chart.
      if (user.id) {
        await prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .then(() => prisma.activityLog.create({ data: { userId: user.id, action: "LOGIN" } }))
          .catch(() => {
            // First-ever sign-in: the adapter creates the row after this
            // callback resolves, so a missing row here is expected once.
          });
      }
      return true;
    },
  },
});
