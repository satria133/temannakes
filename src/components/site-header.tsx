"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type Props = {
  role: "NAKES" | "ADMIN" | null;
  credits: number | null;
  signOutAction: () => Promise<void>;
};

export function SiteHeader({ role, credits, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = [
    { href: "/webinars", label: "Webinar" },
    { href: "/jobs", label: "Loker Medis" },
    ...(role === "NAKES" ? [{ href: "/nakes/skp", label: "SKP Saya" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin/submissions", label: "Admin" }] : []),
  ];

  const creditChip =
    credits !== null ? (
      <Link
        href="/nakes/topup"
        onClick={close}
        className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
      >
        {credits} kredit
      </Link>
    ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2">
          <Image src="/logo.jpg" alt="" width={36} height={36} className="rounded-lg object-cover" priority />
          <span className="text-lg font-semibold tracking-tight text-navy-800">
            Teman<span className="text-brand-600">Nakes</span>
          </span>
        </Link>

        {/* Desktop */}
        <nav className="hidden items-center gap-6 text-sm text-navy-700 md:flex" aria-label="Menu utama">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-600">{l.label}</Link>
          ))}
          {creditChip}
          {role ? (
            <form action={signOutAction}>
              <button className="text-navy-600 hover:text-navy-900">Keluar</button>
            </form>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand-600">Masuk</Link>
              <Link href="/register" className="btn-primary !min-h-9 !px-4 !py-1.5">Daftar gratis</Link>
            </>
          )}
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {creditChip}
          <button
            type="button"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-navy-100 text-navy-800 hover:bg-navy-50"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="border-t border-navy-100 bg-white px-4 pb-4 md:hidden" aria-label="Menu seluler">
          <ul className="divide-y divide-navy-50 text-navy-800">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={close} className="flex min-h-12 items-center">{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            {role ? (
              <form action={signOutAction} className="w-full">
                <button className="btn-secondary w-full">Keluar</button>
              </form>
            ) : (
              <>
                <Link href="/login" onClick={close} className="btn-secondary flex-1">Masuk</Link>
                <Link href="/register" onClick={close} className="btn-primary flex-1">Daftar gratis</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
