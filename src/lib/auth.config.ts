import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no providers (they pull in Prisma/bcrypt, which need the
// Node runtime), just enough to read/shape the JWT session in middleware.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "AUTHORITY" | "VENDOR_MANAGER" | "VENDOR";
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};
