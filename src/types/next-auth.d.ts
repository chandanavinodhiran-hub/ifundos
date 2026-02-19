import "next-auth";

/**
 * Extend NextAuth types to include iFundOS user fields
 */
declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      name: string;
      email: string;
      role: string;
      organizationId: string | null;
      organizationName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
  }
}
