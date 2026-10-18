import type { Role } from "@/lib/constants";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    sv?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    sv?: number;
  }
}
