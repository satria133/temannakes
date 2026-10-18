import Link from "next/link";

const LINKS = [
  { href: "/admin/submissions", label: "Review SKP" },
  { href: "/admin/topups", label: "Topup" },
  { href: "/admin/users", label: "Pengguna & Kredit" },
  { href: "/admin/webinars", label: "Webinar" },
  { href: "/admin/jobs", label: "Loker Medis" },
  { href: "/admin/analytics", label: "Analitik" },
  { href: "/admin/admins", label: "Admin" },
  { href: "/admin/audit", label: "Audit" },
  { href: "/admin/settings", label: "Pengaturan" },
];

// Menu antar-halaman admin; /admin (kartu menu) tidak terjangkau dari header.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl gap-4 overflow-x-auto px-4 py-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap text-zinc-600 hover:text-brand-600">
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
