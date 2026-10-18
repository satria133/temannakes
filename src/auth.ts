import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/constants";
import { clientIp } from "@/lib/client-ip";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/login-throttle";
import { emailVerificationRequired } from "@/lib/email-verification";

// Kode galat dibaca halaman login (?error=<code>); bukan teks bebas.
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}
class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = (credentials?.email as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const key = email.toLowerCase();
        const ip = clientIp(request.headers);
        if (await isLoginBlocked(key, ip)) throw new RateLimitedError();

        const user = await prisma.user.findUnique({ where: { email } });
        const valid = user?.isActive ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !valid) {
          await recordLoginFailure(key, ip);
          return null;
        }

        // Dicek setelah password benar, supaya status verifikasi tidak bocor ke penebak.
        if (user.role === "NAKES" && !user.emailVerifiedAt && emailVerificationRequired()) {
          throw new EmailNotVerifiedError();
        }

        await clearLoginFailures(key, ip);
        return {
          id: user.id,
          email: user.email,
          role: user.role as Role,
          sv: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.sv = (user as { sv?: number }).sv ?? 0;
        return token;
      }
      // Sesi yang sudah berjalan divalidasi ke DB: akun dinonaktifkan, password diganti
      // (sessionVersion naik) atau peran berubah langsung berlaku tanpa menunggu token habis.
      if (!token.sub) return null;
      const current = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isActive: true, role: true, sessionVersion: true },
      });
      if (!current || !current.isActive || current.sessionVersion !== (token.sv ?? 0)) return null;
      token.role = current.role as Role;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
