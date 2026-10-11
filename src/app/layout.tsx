import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth, signOut } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TemanNakes",
  description: "Platform SKP, dokumen profesi, webinar, dan loker untuk tenaga kesehatan",
  icons: { icon: "/logo.jpg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const credits =
    session?.user?.role === "NAKES"
      ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { credits: true } }))
          ?.credits ?? 0
      : null;

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy-50/40 text-navy-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.jpg"
                alt="TemanNakes"
                width={32}
                height={32}
                className="rounded-md object-cover"
                priority
              />
              <span className="font-semibold text-navy-800">
                Teman<span className="text-brand-600">Nakes</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-navy-700">
              <Link href="/webinars" className="hover:text-brand-600">Webinar</Link>
              <Link href="/jobs" className="hover:text-brand-600">Loker Medis</Link>
              {session?.user?.role === "NAKES" && (
                <Link href="/nakes/skp" className="hover:text-brand-600">SKP Saya</Link>
              )}
              {credits !== null && (
                <Link
                  href="/nakes/topup"
                  className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  {credits} kredit
                </Link>
              )}
              {session?.user?.role === "ADMIN" && (
                <Link href="/admin/submissions" className="hover:text-brand-600">Admin</Link>
              )}
              {session ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button className="text-navy-600 hover:text-navy-900">
                    Keluar
                  </button>
                </form>
              ) : (
                <>
                  <Link href="/login" className="hover:text-brand-600">Masuk</Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-white py-6 text-center text-xs text-navy-500">
          TemanNakes — teman bertumbuh, profesional berkembang
        </footer>
      </body>
    </html>
  );
}
