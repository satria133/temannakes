"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotState } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(forgotPasswordAction, undefined);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Lupa password</h1>
      <p className="mt-2 text-sm text-zinc-600">Masukkan email akunmu untuk mendapatkan tautan reset password.</p>

      {state?.sent && state.mail && (
        <p className="mt-4 rounded-md bg-brand-50 p-3 text-sm text-brand-800">
          Jika email terdaftar, tautan reset sudah dikirim dan berlaku 1 jam. Cek juga folder spam.
        </p>
      )}
      {state?.sent && !state.mail && (
        <div className="mt-4 rounded-md bg-brand-50 p-3 text-sm text-brand-800">
          <p>Pengiriman email belum aktif. Minta admin membuatkan tautan reset untuk akunmu.</p>
          {state.waUrl && (
            <a
              href={state.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
            >
              Minta tautan via WhatsApp
            </a>
          )}
        </div>
      )}

      {!state?.sent && (
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
            {pending ? "Memproses..." : "Kirim tautan reset"}
          </button>
        </form>
      )}
      <p className="mt-4 text-sm text-zinc-600">
        <Link href="/login" className="text-brand-700">Kembali ke halaman masuk</Link>
      </p>
    </div>
  );
}
