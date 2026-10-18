import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL_IP = 5;
const MAX_PER_EMAIL = 20; // longgar: mencegah penyerang mengunci akun orang lain dari IP-nya sendiri
const MAX_PER_IP = 30;

const since = () => new Date(Date.now() - WINDOW_MS);

export async function isLoginBlocked(email: string, ip: string): Promise<boolean> {
  const createdAt = { gte: since() };
  const [pair, byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({ where: { email, ip, createdAt } }),
    prisma.loginAttempt.count({ where: { email, createdAt } }),
    prisma.loginAttempt.count({ where: { ip, createdAt } }),
  ]);
  return pair >= MAX_PER_EMAIL_IP || byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP;
}

export async function recordLoginFailure(email: string, ip: string) {
  await prisma.loginAttempt.create({ data: { email, ip } });
  if (Math.random() < 0.02) {
    await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } } });
  }
}

export async function clearLoginFailures(email: string, ip: string) {
  await prisma.loginAttempt.deleteMany({ where: { email, ip } });
}
