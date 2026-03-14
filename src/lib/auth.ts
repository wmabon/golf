import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod/v4";
import * as userService from "@/services/identity/user.service";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await userService.getUserByEmail(parsed.data.email);
        if (!user) return null;

        const valid = await userService.verifyPassword(
          user,
          parsed.data.password
        );
        if (!valid) return null;

        if (user.status !== "active") return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          systemRole: user.systemRole,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = (user as Record<string, unknown>).systemRole as string;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      if (token.systemRole) {
        (session.user as unknown as Record<string, unknown>).systemRole =
          token.systemRole as string;
      }
      return session;
    },
  },
});
