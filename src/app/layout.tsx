import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageViewTracker } from "@/components/page-view-tracker";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "TemanNakes — teman bertumbuh, profesional berkembang", template: "%s · TemanNakes" },
  description:
    "Kelola dokumen SKP dan rekapitulasi praktik profesi untuk STR/SIP, pantau webinar dan loker medis untuk tenaga kesehatan.",
  icons: { icon: "/logo.jpg" },
  openGraph: {
    title: "TemanNakes",
    description: "Teman bertumbuh, profesional berkembang. SKP, webinar, dan loker medis untuk tenaga kesehatan.",
    locale: "id_ID",
    type: "website",
    images: ["/logo.jpg"],
  },
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
      <body className="min-h-full flex flex-col bg-[#f6fafb] text-navy-900">
        <SiteHeader
          role={session?.user?.role ?? null}
          credits={credits}
          signOutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        />
        <main className="flex-1">{children}</main>
        <PageViewTracker />
        <SiteFooter />
      </body>
    </html>
  );
}
