"use client";

import { useActionState } from "react";
import { grantCreditsAction, type GrantState } from "./actions";

export function GrantForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<GrantState, FormData>(grantCreditsAction, undefined);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="amount"
        type="number"
        required
        defaultValue={1}
        className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm"
        aria-label="Jumlah kredit"
      />
      <input
        name="note"
        placeholder="Catatan (mis. transfer BCA 12/10)"
        className="w-56 rounded-md border border-zinc-300 px-2 py-1 text-sm"
      />
      <button
        disabled={pending}
        className="rounded-md bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
      >
        Tambah
      </button>
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-xs text-brand-700">{state.ok}</span>}
    </form>
  );
}
