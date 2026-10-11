"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveSubmissionAction, rejectSubmissionAction } from "./actions";

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-6 space-y-3 border-t pt-4">
      <textarea
        placeholder="Catatan (wajib jika menolak)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="input"
        rows={2}
      />
      <div className="flex gap-3">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await approveSubmissionAction(submissionId);
              router.refresh();
            })
          }
          className="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Setujui
        </button>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await rejectSubmissionAction(submissionId, note);
              router.refresh();
            })
          }
          className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          Tolak
        </button>
      </div>
    </div>
  );
}
