import Link from "next/link";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const registered = params?.registered === "1";
  const error = typeof params?.error === "string" ? params.error : undefined;
  const callbackUrl =
    typeof params?.callbackUrl === "string" ? params.callbackUrl : "/";

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: callbackUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
      throw err;
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold">Masuk</h1>
      {registered && (
        <p className="mt-2 text-sm text-brand-700">
          Pendaftaran berhasil, silakan masuk.
        </p>
      )}
      <form action={login} className="mt-6 space-y-4">
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
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">Email atau password salah.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700"
        >
          Masuk
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">
        Belum punya akun?{" "}
        <Link href="/register" className="text-brand-700">
          Daftar
        </Link>
      </p>
    </div>
  );
}
