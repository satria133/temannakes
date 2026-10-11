import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireNakes() {
  const session = await auth();
  if (!session?.user || session.user.role !== "NAKES") {
    redirect("/login");
  }
  return session.user;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return session.user;
}
