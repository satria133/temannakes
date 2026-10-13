"use client";

import { useActionState, useRef } from "react";
import { createTopupRequestAction, type TopupState } from "./actions";
import { TOPUP_PACKAGES } from "@/lib/constants";

export function TopupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<TopupState, FormData>(async (prev, fd) => {
    const result = await createTopupRequestAction(prev, fd);
    if (result?.ok) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3 text-sm">
      <div>
        <label className="block font-medium text-navy-700">Jumlah kredit</label>
        <select name="credits" defaultValue={5} className="input mt-1 max-w-[12rem]">
          {TOPUP_PACKAGES.map((n) => (
            <option key={n} value={n}>{n} kredit</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium text-navy-700">Bukti transfer</label>
        <input
          name="proof"
          type="file"
          required
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-white file:px-3 file:py-1.5"
        />
        <p className="mt-1 text-xs text-zinc-500">JPG, PNG, WEBP, atau PDF, maksimal 5 MB.</p>
      </div>
      <div>
        <label className="block font-medium text-navy-700">Catatan (opsional)</label>
        <input name="note" maxLength={200} placeholder="mis. transfer atas nama Budi, BCA" className="input mt-1" />
      </div>
      {state?.error && <p className="text-red-600">{state.error}</p>}
      {state?.ok && (
        <p className="text-brand-700">Permintaan terkirim. Kredit ditambahkan setelah admin memverifikasi.</p>
      )}
      <button
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Kirim bukti transfer"}
      </button>
    </form>
  );
}
