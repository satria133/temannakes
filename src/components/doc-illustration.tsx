// Ilustrasi dokumen SKP (SVG, tanpa data nyata) untuk hero.
export function DocIllustration() {
  return (
    <svg viewBox="0 0 420 340" className="h-auto w-full" role="img" aria-label="Contoh dokumen rekapitulasi yang sudah disetujui">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3cb9c0" />
          <stop offset="1" stopColor="#137f87" />
        </linearGradient>
      </defs>
      <rect x="40" y="48" width="300" height="270" rx="18" fill="#cdf3f4" />
      <g>
        <rect x="70" y="14" width="270" height="300" rx="16" fill="#fff" stroke="#cadde7" />
        <rect x="70" y="14" width="270" height="52" rx="16" fill="url(#g1)" />
        <rect x="70" y="50" width="270" height="16" fill="url(#g1)" />
        <circle cx="98" cy="40" r="11" fill="#fff" opacity=".9" />
        <rect x="118" y="30" width="110" height="9" rx="4.5" fill="#fff" />
        <rect x="118" y="44" width="70" height="7" rx="3.5" fill="#fff" opacity=".7" />
        <rect x="92" y="86" width="150" height="9" rx="4.5" fill="#0e2a3a" opacity=".85" />
        <rect x="92" y="104" width="110" height="7" rx="3.5" fill="#9bc0d2" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="92" y={132 + i * 30} width="226" height="22" rx="5" fill={i % 2 ? "#fff" : "#eaf1f5"} />
            <rect x="100" y={139 + i * 30} width={90 + ((i * 23) % 60)} height="8" rx="4" fill="#5f93ad" opacity=".7" />
            <rect x="282" y={139 + i * 30} width="26" height="8" rx="4" fill="#1d9fa7" />
          </g>
        ))}
        <rect x="92" y="290" width="70" height="7" rx="3.5" fill="#9bc0d2" />
      </g>
      <g transform="translate(282 232) rotate(-8)">
        <rect width="116" height="50" rx="12" fill="#fff" stroke="#1d9fa7" strokeWidth="2.5" />
        <circle cx="26" cy="25" r="13" fill="#1d9fa7" />
        <path d="M19.5 25.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="46" y="30" fontSize="14" fontWeight="700" fill="#10656c" fontFamily="system-ui, sans-serif">Disetujui</text>
      </g>
      <g transform="translate(18 258)">
        <rect width="104" height="40" rx="10" fill="#fdf0cf" />
        <text x="14" y="25" fontSize="12.5" fontWeight="600" fill="#9a6a00" fontFamily="system-ui, sans-serif">PDF siap cetak</text>
      </g>
    </svg>
  );
}
