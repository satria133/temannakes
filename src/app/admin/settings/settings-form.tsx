"use client";

import { useActionState } from "react";
import { saveSettingsAction, type SettingsState } from "./actions";

export function SettingsForm({ adminWhatsapp, creditPriceLabel }: { adminWhatsapp: string; creditPriceLabel: string }) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-lg border bg-white p-5">
      <div>
        <label className="block text-sm font-medium text-navy-700">Nomor WhatsApp admin (topup)</label>
        <input
          name="adminWhatsapp"
          defaultValue={adminWhatsapp}
          placeholder="6281234567890"
          inputMode="numeric"
          className="input mt-1"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Format 62 tanpa + atau spasi. Kosongkan untuk menyembunyikan tombol WhatsApp.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700">Teks harga kredit</label>
        <input
          name="creditPriceLabel"
          defaultValue={creditPriceLabel}
          placeholder="Rp25.000 per dokumen"
          className="input mt-1"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Hanya tampilan di halaman topup; pembayaran tetap dikonfirmasi manual oleh admin.
        </p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand-700">Pengaturan tersimpan.</p>}
      <button
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}
