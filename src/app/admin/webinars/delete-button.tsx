"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWebinarAction } from "./actions";

export function DeleteWebinarButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deleteWebinarAction(id);
          router.refresh();
        })
      }
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      Hapus
    </button>
  );
}
