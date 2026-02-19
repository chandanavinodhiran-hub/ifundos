import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

/**
 * NextAuth configuration for iFundOS
 * Uses credentials provider (email + password) with role-based sessions
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });

        if (!user) {
          throw new Error("No account found with that email");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Account is suspended or pending approval");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, attach user fields to the JWT
      if (user) {
        const u = user as { id: string; role: string; organizationId: string | null; organizationName: string | null };
        token.userId = u.id;
        token.role = u.role;
        token.organizationId = u.organizationId;
        token.organizationName = u.organizationName;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role and org info in the client session
      if (session.user) {
        session.user.userId = token.userId as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await logAuditEvent({
        actorId: user.id,
        action: "AUTH_LOGIN",
        resourceType: "USER",
        resourceId: user.id,
        purpose: "User authentication",
        details: { email: user.email },
      });
    },
    async signOut({ token }) {
      await logAuditEvent({
        actorId: token.userId as string,
        action: "AUTH_LOGOUT",
        resourceType: "USER",
        resourceId: token.userId as string,
        purpose: "User sign out",
      });
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
