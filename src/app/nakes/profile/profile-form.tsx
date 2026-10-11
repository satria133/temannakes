"use client";

import { useActionState } from "react";
import { saveProfileAction, type ProfileState } from "./actions";
import type { Profession } from "@/lib/constants";

type DefaultValues = {
  fullName: string;
  profession: string;
  educationLevel: string;
  yearsOfService: number;
  serviceResponsibility: string;
  strNumber: string;
  sipNumber: string;
  sipValidUntil: string;
  position: string;
};

export function ProfileForm({
  professions,
  labels,
  defaultValues,
}: {
  professions: readonly Profession[];
  labels: Record<Profession, string>;
  defaultValues?: DefaultValues;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Nama Lengkap">
        <input
          name="fullName"
          required
          defaultValue={defaultValues?.fullName}
          className="input"
        />
      </Field>

      <Field label="Jenis Profesi">
        <select
          name="profession"
          required
          defaultValue={defaultValues?.profession}
          className="input"
        >
          <option value="" disabled>
            Pilih profesi
          </option>
          {professions.map((p) => (
            <option key={p} value={p}>
              {labels[p]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tingkat Pendidikan">
        <input
          name="educationLevel"
          required
          placeholder="mis. D3, S1, Profesi, S2"
          defaultValue={defaultValues?.educationLevel}
          className="input"
        />
      </Field>

      <Field label="Masa Kerja (tahun)">
        <input
          name="yearsOfService"
          type="number"
          min={0}
          required
          defaultValue={defaultValues?.yearsOfService}
          className="input"
        />
      </Field>

      <Field label="Tanggung Jawab Pelayanan">
        <textarea
          name="serviceResponsibility"
          required
          rows={3}
          defaultValue={defaultValues?.serviceResponsibility}
          className="input"
        />
      </Field>

      <Field label="No. STR">
        <input
          name="strNumber"
          required
          defaultValue={defaultValues?.strNumber}
          className="input"
        />
      </Field>

      <Field label="No. SIP">
        <input
          name="sipNumber"
          required
          defaultValue={defaultValues?.sipNumber}
          className="input"
        />
      </Field>

      <Field label="SIP Berlaku Sampai">
        <input
          name="sipValidUntil"
          type="date"
          required
          defaultValue={defaultValues?.sipValidUntil}
          className="input"
        />
      </Field>

      <Field label="Jabatan">
        <input
          name="position"
          required
          defaultValue={defaultValues?.position}
          className="input"
        />
      </Field>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Profil"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
