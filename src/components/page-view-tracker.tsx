"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Mengirim satu hit per perpindahan halaman (SPA). Gagal diam-diam; tidak memakai cookie.
export function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (/^\/(admin|api|files)(\/|$)/.test(pathname)) return;
    try {
      const body = JSON.stringify({ path: pathname, referrer: document.referrer });
      if (!navigator.sendBeacon?.("/api/track", body)) {
        void fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
      }
    } catch {}
  }, [pathname]);
  return null;
}
