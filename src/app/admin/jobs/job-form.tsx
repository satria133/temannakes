"use client";

import { useActionState } from "react";
import { createJobAction, type JobFormState } from "./actions";

export function JobForm() {
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(
    createJobAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border bg-white p-4">
      <input name="title" placeholder="Judul lowongan" required className="input" />
      <input name="institution" placeholder="Instansi" required className="input" />
      <textarea
        name="description"
        placeholder="Deskripsi"
        required
        rows={2}
        className="input"
      />
      <input name="location" placeholder="Lokasi" required className="input" />
      <input
        name="applyLink"
        type="url"
        placeholder="Link lamaran"
        required
        className="input"
      />
      <label className="block text-sm text-zinc-600">Berakhir pada</label>
      <input name="expiresAt" type="date" required className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah Loker"}
      </button>
    </form>
  );
}
