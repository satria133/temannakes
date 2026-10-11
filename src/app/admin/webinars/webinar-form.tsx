"use client";

import { useActionState } from "react";
import { createWebinarAction, type WebinarFormState } from "./actions";

export function WebinarForm() {
  const [state, formAction, pending] = useActionState<
    WebinarFormState,
    FormData
  >(createWebinarAction, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border bg-white p-4">
      <input name="title" placeholder="Judul webinar" required className="input" />
      <textarea
        name="description"
        placeholder="Deskripsi"
        required
        rows={2}
        className="input"
      />
      <input name="eventDate" type="date" required className="input" />
      <input
        name="registrationLink"
        type="url"
        placeholder="Link pendaftaran"
        required
        className="input"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah Webinar"}
      </button>
    </form>
  );
}
