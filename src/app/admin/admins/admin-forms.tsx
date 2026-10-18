"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addAdminAction, adminResetLinkAction, changeAdminEmailAction, promoteAdminAction,
  toggleAdminActiveAction, type AdminFormState,
} from "./actions";

function Msg({ s }: { s: AdminFormState }) {
  return (
    <>
      {s?.error && <p className="mt-1 text-xs text-red-600">{s.error}</p>}
      {s?.ok && <p className="mt-1 text-xs text-brand-700">{s.ok}</p>}
    </>
  );
}

export function AddAdminForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(addAdminAction, undefined);
  return (
    <form action={action} className="space-y-2 text-sm">
      <input name="email" type="email" required defaultValue={state?.email} key={state?.email} placeholder="Email admin baru" className="input" />
      <input name="password" type="password" required minLength={10} autoComplete="new-password" placeholder="Password (min. 10 karakter)" className="input" />
      <button disabled={pending} className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700 disabled:opacity-50">
        {pending ? "Menyimpan..." : "Tambah admin"}
      </button>
      <Msg s={state} />
    </form>
  );
}

export function PromoteForm() {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(promoteAdminAction, undefined);
  return (
    <form action={action} className="space-y-2 text-sm">
      <input name="email" type="email" required defaultValue={state?.email} key={state?.email} placeholder="Email akun nakes yang sudah ada" className="input" />
      <label className="flex items-start gap-2 text-xs text-zinc-600">
        <input name="confirm" type="checkbox" className="mt-0.5" />
        <span>
          Saya paham: password akun itu tidak berubah, dan dokumen/kredit nakes-nya tidak bisa dibuka lagi lewat
          tampilan karena halaman nakes tertutup untuk admin. Hanya lakukan untuk akun milik sendiri.
        </span>
      </label>
      <button disabled={pending} className="rounded-md border px-3 py-1.5 hover:bg-zinc-50 disabled:opacity-50">
        {pending ? "Memproses..." : "Jadikan admin"}
      </button>
      <Msg s={state} />
    </form>
  );
}

export function AdminRowActions({ id, active, isSelf }: { id: string; active: boolean; isSelf: boolean }) {
  const [msg, setMsg] = useState<AdminFormState>();
  const [pending, start] = useTransition();
  const [showEmail, setShowEmail] = useState(false);
  const [emailState, emailAction, emailPending] = useActionState<AdminFormState, FormData>(
    changeAdminEmailAction.bind(null, id), undefined
  );

  return (
    <div className="space-y-2 text-xs">
      <div className="flex flex-wrap gap-2">
        {!isSelf && (
          <button
            disabled={pending}
            onClick={() => start(async () => setMsg(await toggleAdminActiveAction(id, !active)))}
            className="rounded-md border px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
          >
            {active ? "Nonaktifkan" : "Aktifkan"}
          </button>
        )}
        <button onClick={() => setShowEmail((v) => !v)} className="rounded-md border px-2 py-1 hover:bg-zinc-50">
          Ganti email
        </button>
        <button
          disabled={pending}
          onClick={() => start(async () => setMsg(await adminResetLinkAction(id)))}
          className="rounded-md border px-2 py-1 hover:bg-zinc-50 disabled:opacity-50"
        >
          Tautan reset password
        </button>
      </div>
      {showEmail && (
        <form action={emailAction} className="flex gap-2">
          <input name="email" type="email" required placeholder="Email baru" className="w-52 rounded-md border px-2 py-1" />
          <button disabled={emailPending} className="rounded-md bg-brand-600 px-2 py-1 text-white disabled:opacity-50">Simpan</button>
        </form>
      )}
      <Msg s={emailState} />
      <Msg s={msg} />
      {msg?.url && (
        <div>
          <input readOnly value={msg.url} onFocus={(e) => e.currentTarget.select()} className="w-64 rounded-md border px-2 py-1" />
          <p className="mt-1 text-zinc-500">Berlaku 1 jam, sekali pakai.</p>
        </div>
      )}
    </div>
  );
}
