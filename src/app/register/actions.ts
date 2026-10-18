"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { emailVerificationRequired, sendVerificationEmail } from "@/lib/email-verification";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export type RegisterState = { error?: string } | undefined;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "NAKES" },
  });

  if (emailVerificationRequired()) {
    try {
      await sendVerificationEmail(user);
    } catch (err) {
      console.error("register: gagal mengirim email verifikasi", err);
    }
    redirect("/login?registered=verify");
  }
  redirect("/login?registered=1");
}
