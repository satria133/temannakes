import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/client-ip";
import { dayWIB, deviceFromUa, isBot, referrerHost, trackablePath, visitorHash } from "@/lib/analytics";

const RETENTION_DAYS = 400;

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return new Response(null, { status: 204 });

  let body: { path?: unknown; referrer?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const path = trackablePath(body.path);
  if (!path) return new Response(null, { status: 204 });

  const ip = clientIp(request.headers);
  const day = dayWIB();

  await prisma.pageView.create({
    data: {
      path,
      day,
      visitorHash: visitorHash(ip, ua, day),
      referrer: referrerHost(body.referrer, request.headers.get("host")),
      device: deviceFromUa(ua),
    },
  });

  // Pembersihan data lama sesekali, tanpa cron.
  if (Math.random() < 0.005) {
    const cutoff = dayWIB(new Date(Date.now() - RETENTION_DAYS * 86400_000));
    await prisma.pageView.deleteMany({ where: { day: { lt: cutoff } } });
  }
  return new Response(null, { status: 204 });
}
