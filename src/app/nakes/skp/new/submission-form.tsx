"use client";

import { useActionState, useMemo, useState } from "react";
import { createSubmissionAction, type SubmissionFormState } from "./actions";
import { MONTH_LABELS } from "@/lib/constants";

type ActivityTemplate = { id: string; name: string; groupLabel: string | null };
type Institution = { id: string; name: string };

type Row = {
  key: string;
  templateId?: string;
  label: string;
  editable: boolean;
};

export function SubmissionForm({
  profession,
  activityTemplates,
  institutions,
}: {
  profession: string;
  professionLabel: string;
  activityTemplates: ActivityTemplate[];
  institutions: Institution[];
}) {
  const [state, formAction, pending] = useActionState<
    SubmissionFormState,
    FormData
  >(createSubmissionAction, undefined);

  const now = new Date();
  const [periodMonths, setPeriodMonths] = useState<6 | 12>(6);
  const [startMonth, setStartMonth] = useState(now.getMonth() + 1);
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [institutionId, setInstitutionId] = useState(
    institutions[0]?.id ?? "NEW"
  );
  const [extraRows, setExtraRows] = useState<Row[]>([]);

  const baseRows: Row[] = activityTemplates.map((t) => ({
    key: t.id,
    templateId: t.id,
    label: t.groupLabel ? `${t.groupLabel} — ${t.name}` : t.name,
    editable: false,
  }));
  const rows = [...baseRows, ...extraRows];

  const months = useMemo(() => {
    const list: { month: number; year: number; label: string }[] = [];
    for (let i = 0; i < periodMonths; i++) {
      const d = new Date(Date.UTC(startYear, startMonth - 1 + i, 1));
      list.push({
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
        label: `${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      });
    }
    return list;
  }, [periodMonths, startMonth, startYear]);

  function addCustomRow() {
    setExtraRows((prev) => [
      ...prev,
      { key: `custom-${prev.length}-${Date.now()}`, label: "", editable: true },
    ]);
  }

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="mt-6 space-y-6"
    >
      <input type="hidden" name="profession" value={profession} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium">Periode</label>
          <select
            name="periodMonths"
            className="input mt-1"
            value={periodMonths}
            onChange={(e) => setPeriodMonths(Number(e.target.value) as 6 | 12)}
          >
            <option value={6}>6 bulan</option>
            <option value={12}>12 bulan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Bulan Mulai</label>
          <select
            name="periodStartMonth"
            className="input mt-1"
            value={startMonth}
            onChange={(e) => setStartMonth(Number(e.target.value))}
          >
            {MONTH_LABELS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Tahun Mulai</label>
          <input
            name="periodStartYear"
            type="number"
            className="input mt-1"
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Instansi (Kop Surat)</label>
        <select
          name="institutionId"
          className="input mt-1"
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
        >
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
          <option value="NEW">+ Instansi baru (upload kop surat)</option>
        </select>

        {institutionId === "NEW" && (
          <div className="mt-3 space-y-3 rounded-md border border-dashed p-3">
            <div>
              <label className="block text-sm font-medium">Nama Instansi</label>
              <input name="newInstitutionName" className="input mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium">
                File Kop Surat (gambar)
              </label>
              <input
                name="newInstitutionLetterhead"
                type="file"
                accept="image/*"
                className="input mt-1"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Jumlah Pasien / Sampel per Bulan
          </h2>
          <button
            type="button"
            onClick={addCustomRow}
            className="text-sm text-brand-700 hover:underline"
          >
            + Tambah kegiatan lain
          </button>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border bg-zinc-100 px-2 py-1 text-left">
                  Nama Kegiatan
                </th>
                {months.map((m, i) => (
                  <th key={i} className="border bg-zinc-100 px-2 py-1">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="border px-2 py-1">
                    <input type="hidden" name="rowKey" value={row.key} />
                    <input
                      type="hidden"
                      name="rowTemplateId"
                      value={row.templateId ?? ""}
                    />
                    {row.editable ? (
                      <input
                        name="rowCustomName"
                        placeholder="Nama kegiatan"
                        className="input"
                      />
                    ) : (
                      <>
                        <input type="hidden" name="rowCustomName" value="" />
                        {row.label}
                      </>
                    )}
                  </td>
                  {months.map((_, monthIndex) => (
                    <td key={monthIndex} className="border px-1 py-1">
                      <input
                        type="number"
                        min={0}
                        defaultValue={0}
                        name={`qty-${row.key}-${monthIndex}`}
                        className="w-16 rounded border px-1 py-0.5 text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Bukti Pendukung (logbook/foto, bisa lebih dari satu)
        </label>
        <input
          name="evidenceFiles"
          type="file"
          multiple
          className="input mt-1"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Ajukan untuk Review"}
      </button>
    </form>
  );
}
