import Link from "next/link";
import { isResetTokenValid } from "@/lib/password-reset";
import { ResetForm } from "./reset-form";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";
  const valid = await isResetTokenValid(token);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Reset password</h1>
      {valid ? (
        <ResetForm token={token} />
      ) : (
        <div className="mt-4 text-sm">
          <p className="text-red-600">Tautan tidak valid atau sudah kedaluwarsa.</p>
          <Link href="/forgot-password" className="mt-2 inline-block text-brand-700">
            Minta tautan baru
          </Link>
        </div>
      )}
    </div>
  );
}
