"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importLokermedisAction } from "./actions";

type Totals = { added: number; skipped: number; expired: number; nonHealth: number; failed: number };
const EMPTY: Totals = { added: 0, skipped: 0, expired: 0, nonHealth: 0, failed: 0 };

export function ImportLokermedis() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ offset: number; total: number } | null>(null);
  const [totals, setTotals] = useState<Totals>(EMPTY);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setRunning(true);
    setFinished(false);
    setError(null);
    setTotals(EMPTY);
    let offset = 0;
    const sum = { ...EMPTY };
    try {
      for (;;) {
        const r = await importLokermedisAction(offset);
        for (const k of Object.keys(sum) as (keyof Totals)[]) sum[k] += r[k];
        setTotals({ ...sum });
        offset = r.nextOffset;
        setProgress({ offset, total: r.total });
        if (r.done) break;
      }
      setFinished(true);
      router.refresh();
    } catch {
      setError("Impor terhenti. Klik lagi untuk melanjutkan; loker yang sudah masuk tidak akan terduplikasi.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">Impor dari LokerMedis.id</p>
          <p className="text-xs text-zinc-500">
            Hanya loker tenaga kesehatan yang masih aktif. Aman diulang (tanpa duplikat).
          </p>
        </div>
        <button
          onClick={start}
          disabled={running}
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {running ? "Mengimpor…" : "Impor sekarang"}
        </button>
      </div>
      {progress && (
        <p className="mt-3 text-xs text-zinc-600">
          {finished ? "Selesai" : "Memproses"} {progress.offset}/{progress.total} · ditambahkan{" "}
          {totals.added} · sudah ada {totals.skipped} · kedaluwarsa {totals.expired} · bukan nakes{" "}
          {totals.nonHealth} · gagal {totals.failed}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
