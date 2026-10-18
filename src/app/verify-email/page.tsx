import Link from "next/link";
import { isVerificationTokenValid } from "@/lib/email-verification";
import { confirmEmailAction } from "./actions";

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";
  const valid = await isVerificationTokenValid(token);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Verifikasi email</h1>
      {valid ? (
        <form action={confirmEmailAction} className="mt-4">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm text-zinc-600">Klik tombol di bawah untuk menyelesaikan verifikasi email.</p>
          <button className="mt-4 w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700">
            Verifikasi email saya
          </button>
        </form>
      ) : (
        <div className="mt-4 text-sm">
          <p className="text-red-600">Tautan tidak valid atau sudah kedaluwarsa.</p>
          <Link href="/resend-verification" className="mt-2 inline-block text-brand-700">
            Kirim ulang email verifikasi
          </Link>
        </div>
      )}
    </div>
  );
}
