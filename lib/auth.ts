import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { canSignInToPanel, normalizeUsername, type UserRole } from "@/lib/domain/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      // The form's "email" field is the username (the owner's username is
      // their email). Only active owners get into the panel — sellers only
      // sign in from the mobile app (see lib/domain/users.ts).
      async authorize(credentials) {
        const username = normalizeUsername((credentials?.email as string) ?? "");
        const password = (credentials?.password as string) ?? "";
        if (!username || !password) return null;

        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (!user || !canSignInToPanel({ role: user.role as UserRole, active: user.active })) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: String(user.id), email: user.username, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
});
