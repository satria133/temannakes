"use client";

import { useState, useTransition } from "react";
import { createResetLinkAction, type ResetLinkState } from "./actions";

export function ResetLinkButton({ userId }: { userId: string }) {
  const [state, setState] = useState<ResetLinkState>();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {}
  }

  return (
    <div className="text-xs">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setCopied(false);
            setState(await createResetLinkAction(userId));
          })
        }
        className="rounded-md border px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
      >
        {pending ? "Membuat..." : "Buat tautan reset"}
      </button>
      {state?.error && <p className="mt-1 text-red-600">{state.error}</p>}
      {state?.url && (
        <div className="mt-2 w-56">
          <input readOnly value={state.url} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-md border px-2 py-1" />
          <button onClick={() => copy(state.url!)} className="mt-1 text-brand-700 hover:underline">
            {copied ? "Tersalin" : "Salin"}
          </button>
          <p className="mt-1 text-zinc-500">Berlaku 1 jam, sekali pakai. Kirim ke nakes lewat WhatsApp.</p>
        </div>
      )}
    </div>
  );
}
