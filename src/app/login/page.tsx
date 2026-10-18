import Link from "next/link";
import { signIn } from "@/auth";
import { AuthError, CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const registered = params?.registered === "1";
  const verified = params?.verified === "1";
  const registeredVerify = params?.registered === "verify";
  const passwordReset = params?.reset === "1";
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
        const code =
          err instanceof CredentialsSignin && ["rate_limited", "email_not_verified"].includes(err.code)
            ? err.code
            : "1";
        redirect(`/login?error=${code}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
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
      {registeredVerify && (
        <p className="mt-2 text-sm text-brand-700">
          Pendaftaran berhasil. Kami mengirim email verifikasi, buka tautannya lalu masuk.
        </p>
      )}
      {verified && (
        <p className="mt-2 text-sm text-brand-700">Email terverifikasi, silakan masuk.</p>
      )}
      {passwordReset && (
        <p className="mt-2 text-sm text-brand-700">
          Password berhasil diubah, silakan masuk dengan password baru.
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
        {error === "rate_limited" ? (
          <p className="text-sm text-red-600">
            Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit, atau reset password.
          </p>
        ) : error === "email_not_verified" ? (
          <p className="text-sm text-red-600">
            Email belum diverifikasi.{" "}
            <Link href="/resend-verification" className="underline">
              Kirim ulang email verifikasi
            </Link>
          </p>
        ) : (
          error && <p className="text-sm text-red-600">Email atau password salah.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-brand-600 py-2 text-white hover:bg-brand-700"
        >
          Masuk
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">
        <Link href="/forgot-password" className="text-brand-700">
          Lupa password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        Belum punya akun?{" "}
        <Link href="/register" className="text-brand-700">
          Daftar
        </Link>
      </p>
    </div>
  );
}
