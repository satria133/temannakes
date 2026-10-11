import { requireAdmin } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-xl font-semibold text-navy-800">Pengaturan</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Berlaku langsung di halaman topup dan tombol &quot;Hubungi admin&quot;, tanpa deploy ulang.
      </p>
      <SettingsForm {...settings} />
    </div>
  );
}
