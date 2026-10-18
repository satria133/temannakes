import Link from "next/link";
import { getTopupInfo } from "@/lib/topup";

export async function SiteFooter() {
  const wa = (await getTopupInfo()).whatsappUrl("Halo TemanNakes, saya ingin bertanya.");
  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold tracking-tight text-navy-800">
            Teman<span className="text-brand-600">Nakes</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-navy-600">Teman bertumbuh, profesional berkembang.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800">Menu</p>
          <ul className="mt-3 space-y-2 text-sm text-navy-600">
            <li><Link href="/jobs" className="hover:text-brand-600">Loker Medis</Link></li>
            <li><Link href="/webinars" className="hover:text-brand-600">Webinar</Link></li>
            <li><Link href="/register" className="hover:text-brand-600">Daftar</Link></li>
            <li><Link href="/login" className="hover:text-brand-600">Masuk</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-navy-800">Kontak</p>
          <ul className="mt-3 space-y-2 text-sm text-navy-600">
            {wa ? (
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">
                  WhatsApp admin
                </a>
              </li>
            ) : (
              <li>Hubungi admin lewat aplikasi.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-navy-100 py-4 text-center text-xs text-navy-500">
        © {new Date().getFullYear()} TemanNakes
      </div>
    </footer>
  );
}
