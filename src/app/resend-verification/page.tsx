"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resendVerificationAction, type ResendState } from "./actions";

export default function ResendVerificationPage() {
  const [state, formAction, pending] = useActionState<ResendState, FormData>(resendVerificationAction, undefined);
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Kirim ulang email verifikasi</h1>
      {state?.sent ? (
        <p className="mt-4 rounded-md bg-brand-50 p-3 text-sm text-brand-800">
          Jika email terdaftar dan belum terverifikasi, tautan verifikasi baru sudah dikirim. Cek juga folder spam.
        </p>
      ) : (
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button
            disabled={pending}
            className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Mengirim..." : "Kirim ulang"}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="text-brand-700">Kembali ke halaman masuk</Link>
      </p>
    </div>
  );
}
