"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ResetState } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(resetPasswordAction, undefined);
  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="block text-sm font-medium">Password baru</label>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-md border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Ulangi password baru</label>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-md border px-3 py-2" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        disabled={pending}
        className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan password baru"}
      </button>
    </form>
  );
}
