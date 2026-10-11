"use client";

import { useActionState, useMemo, useState } from "react";
import { MONTH_LABELS, type Profession } from "@/lib/constants";
import type { SubmissionFormState } from "@/lib/submission-input";

export type TemplateOption = { id: string; name: string; groupLabel: string | null };

export type SubmissionDefaults = {
  profession: string;
  periodMonths: 6 | 12;
  periodStartMonth: number;
  periodStartYear: number;
  institutionId?: string;
  fullName: string;
  strNumber: string;
  sipNumber: string;
  sipValidUntil: string; // yyyy-mm-dd
  position: string;
  employeeNip: string;
  supervisorName: string;
  supervisorNip: string;
  city: string;
  // key: `${templateId}|${year}-${month}` or `custom:${name}|${year}-${month}`
  quantities: Record<string, number>;
  customActivities: string[];
  extraTemplates: TemplateOption[];
  evidenceFiles: { id: string; fileName: string; fileUrl: string }[];
};

type Row = { key: string; templateId?: string; label: string; customName?: string };

export function SubmissionForm({
  action,
  mode,
  isDraft,
  professions,
  professionLabels,
  templatesByProfession,
  institutions,
  defaults,
}: {
  action: (state: SubmissionFormState, formData: FormData) => Promise<SubmissionFormState>;
  mode: "create" | "edit";
  isDraft: boolean;
  professions: readonly Profession[];
  professionLabels: Record<Profession, string>;
  templatesByProfession: Record<string, TemplateOption[]>;
  institutions: { id: string; name: string }[];
  defaults: SubmissionDefaults;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [profession, setProfession] = useState(defaults.profession);
  const [periodMonths, setPeriodMonths] = useState<6 | 12>(defaults.periodMonths);
  const [startMonth, setStartMonth] = useState(defaults.periodStartMonth);
  const [startYear, setStartYear] = useState(defaults.periodStartYear);
  const [institutionId, setInstitutionId] = useState(
    defaults.institutionId ?? institutions[0]?.id ?? "NEW"
  );
  const [customRows, setCustomRows] = useState<Row[]>(() =>
    defaults.customActivities.map((name, i) => ({
      key: `custom-existing-${i}`,
      label: name,
      customName: name,
    }))
  );

  const templateRows: Row[] = useMemo(() => {
    const active = templatesByProfession[profession] ?? [];
    const extra =
      profession === defaults.profession
        ? defaults.extraTemplates.filter((t) => !active.some((a) => a.id === t.id))
        : [];
    return [...active, ...extra].map((t) => ({
      key: t.id,
      templateId: t.id,
      label: t.groupLabel ? `${t.groupLabel} — ${t.name}` : t.name,
    }));
  }, [profession, templatesByProfession, defaults.profession, defaults.extraTemplates]);

  const rows = [...templateRows, ...customRows];

  const months = useMemo(() => {
    const list: { month: number; year: number; label: string }[] = [];
    for (let i = 0; i < periodMonths; i++) {
      const d = new Date(Date.UTC(startYear, startMonth - 1 + i, 1));
      list.push({
        month: d.getUTCMonth() + 1,
        year: d.getUTCFullYear(),
        label: `${MONTH_LABELS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`,
      });
    }
    return list;
  }, [periodMonths, startMonth, startYear]);

  function defaultQty(row: Row, m: { month: number; year: number }) {
    const base = row.templateId ?? `custom:${row.customName ?? ""}`;
    return defaults.quantities[`${base}|${m.year}-${m.month}`] ?? 0;
  }

  function addCustomRow() {
    setCustomRows((prev) => [...prev, { key: `custom-new-${Date.now()}`, label: "" }]);
  }

  function removeCustomRow(key: string) {
    setCustomRows((prev) => prev.filter((r) => r.key !== key));
  }

  return (
    <form action={formAction} className="mt-6 space-y-8">
      <Section title="Profesi & Periode">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Profesi" className="sm:col-span-4">
            <select
              name="profession"
              className="input"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            >
              {professions.map((p) => (
                <option key={p} value={p}>
                  {professionLabels[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Periode">
            <select
              name="periodMonths"
              className="input"
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value) as 6 | 12)}
            >
              <option value={6}>6 bulan</option>
              <option value={12}>12 bulan</option>
            </select>
          </Field>
          <Field label="Bulan mulai">
            <select
              name="periodStartMonth"
              className="input"
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
            >
              {MONTH_LABELS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tahun mulai">
            <input
              name="periodStartYear"
              type="number"
              min={2000}
              max={2100}
              className="input"
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Data Tenaga Kesehatan"
        hint="Terisi otomatis dari profil, bisa diubah khusus untuk dokumen ini."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap (dengan gelar)">
            <input name="fullName" required defaultValue={defaults.fullName} className="input" />
          </Field>
          <Field label="Jabatan">
            <input name="position" required defaultValue={defaults.position} className="input" />
          </Field>
          <Field label="No. STR">
            <input name="strNumber" required defaultValue={defaults.strNumber} className="input" />
          </Field>
          <Field label="No. SIP">
            <input name="sipNumber" required defaultValue={defaults.sipNumber} className="input" />
          </Field>
          <Field label="SIP berlaku sampai">
            <input
              name="sipValidUntil"
              type="date"
              required
              defaultValue={defaults.sipValidUntil}
              className="input"
            />
          </Field>
          <Field label="NIP pegawai (opsional)">
            <input name="employeeNip" defaultValue={defaults.employeeNip} className="input" />
          </Field>
        </div>
      </Section>

      <Section title="Instansi & Atasan">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instansi (kop surat)" className="sm:col-span-2">
            <select
              name="institutionId"
              className="input"
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
          </Field>
          {institutionId === "NEW" && (
            <div className="grid gap-4 rounded-md border border-dashed border-brand-300 p-3 sm:col-span-2 sm:grid-cols-2">
              <Field label="Nama instansi">
                <input name="newInstitutionName" className="input" placeholder="mis. RSUD Kota Sehat" />
              </Field>
              <Field label="File kop surat (PNG/JPG)">
                <input
                  name="newInstitutionLetterhead"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="input"
                />
              </Field>
            </div>
          )}
          <Field label="Nama atasan / pimpinan">
            <input
              name="supervisorName"
              required
              defaultValue={defaults.supervisorName}
              className="input"
              placeholder="Nama lengkap dengan gelar"
            />
          </Field>
          <Field label="NIP atasan (opsional)">
            <input name="supervisorNip" defaultValue={defaults.supervisorNip} className="input" />
          </Field>
          <Field label="Kota tanda tangan (opsional)">
            <input
              name="city"
              defaultValue={defaults.city}
              className="input"
              placeholder="mis. Probolinggo"
            />
          </Field>
        </div>
      </Section>

      <Section title="Jumlah Pasien / Sampel per Bulan">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border bg-navy-50 px-2 py-1 text-left text-navy-800">Nama kegiatan</th>
                {months.map((m) => (
                  <th
                    key={`${m.year}-${m.month}`}
                    className="whitespace-nowrap border bg-navy-50 px-2 py-1 text-navy-800"
                  >
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td className="min-w-56 border px-2 py-1">
                    <input type="hidden" name="rowKey" value={row.key} />
                    <input type="hidden" name="rowTemplateId" value={row.templateId ?? ""} />
                    {row.templateId ? (
                      <>
                        <input type="hidden" name="rowCustomName" value="" />
                        {row.label}
                      </>
                    ) : (
                      <div className="flex gap-1">
                        <input
                          name="rowCustomName"
                          placeholder="Nama kegiatan lain"
                          defaultValue={row.customName}
                          className="input"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomRow(row.key)}
                          className="px-1 text-red-600"
                          aria-label="Hapus baris"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </td>
                  {months.map((m, monthIndex) => (
                    <td key={`${row.key}-${m.year}-${m.month}`} className="border px-1 py-1">
                      <input
                        type="number"
                        min={0}
                        defaultValue={defaultQty(row, m)}
                        name={`qty-${row.key}-${monthIndex}`}
                        className="w-16 rounded border border-zinc-300 px-1 py-0.5 text-center"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addCustomRow}
          className="mt-2 text-sm text-brand-700 hover:underline"
        >
          + Tambah kegiatan lain
        </button>
      </Section>

      <Section title="Bukti Pendukung" hint="Logbook, buku register, atau foto (PDF/JPG/PNG, maks 10MB per file).">
        {defaults.evidenceFiles.length > 0 && (
          <ul className="mb-3 space-y-1 text-sm">
            {defaults.evidenceFiles.map((f) => (
              <li key={f.id} className="flex items-center gap-3">
                <a href={f.fileUrl} target="_blank" className="text-brand-700 hover:underline">
                  {f.fileName}
                </a>
                <label className="flex items-center gap-1 text-xs text-red-600">
                  <input type="checkbox" name="removeEvidenceIds" value={f.id} /> hapus
                </label>
              </li>
            ))}
          </ul>
        )}
        <input
          name="evidenceFiles"
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg,image/webp"
          className="input"
        />
      </Section>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {isDraft && (
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            className="rounded-md border border-brand-600 px-4 py-2 text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          >
            Simpan Draft
          </button>
        )}
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending
            ? "Menyimpan..."
            : mode === "edit" && !isDraft
            ? "Simpan & Ajukan Ulang"
            : "Ajukan untuk Review"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold text-navy-800">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-navy-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
