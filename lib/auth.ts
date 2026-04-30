import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        if (email !== process.env.ADMIN_EMAIL) return null;

        const hash = process.env.ADMIN_PASSWORD_HASH;
        if (!hash) return null;

        const valid = await bcrypt.compare(password, hash);
        if (!valid) return null;

        return { id: "1", email, name: "Admin" };
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
