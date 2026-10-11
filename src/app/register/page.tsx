"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    undefined
  );

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Daftar sebagai Nakes</h1>
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Mendaftar..." : "Daftar"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand-700">
          Masuk
        </Link>
      </p>
    </div>
  );
}
