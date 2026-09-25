/**
 * Saffron Yard identity: a courtyard arch (the "yard") framing a saffron
 * crocus with its three red stigmas (the "saffron"). Original artwork.
 */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M5 45V22C5 11.5 13.5 3 24 3s19 8.5 19 19v23H5Z" fill="#9E2A2B" />
      <path d="M9 45V22.5C9 14 15.7 7.2 24 7.2S39 14 39 22.5V45" fill="none" stroke="#F2B233" strokeWidth="1.4" opacity=".55" />
      <path d="M24 40c-7.5-2.6-10.6-9.6-8.4-17.4 3.8 2.2 6.6 6.3 8.4 11.3 1.8-5 4.6-9.1 8.4-11.3 2.2 7.8-.9 14.8-8.4 17.4Z" fill="#F2B233" />
      <path d="M24 40c-2.6-4.6-3-11.4 0-19 3 7.6 2.6 14.4 0 19Z" fill="#E89B12" />
      <path d="M24 27.5V14.5M24 27.5l-4.3-10.8M24 27.5l4.3-10.8" stroke="#D8452C" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="24" cy="14" r="1.7" fill="#D8452C" />
      <circle cx="19.5" cy="16.2" r="1.7" fill="#D8452C" />
      <circle cx="28.5" cy="16.2" r="1.7" fill="#D8452C" />
      <path d="M5 45h38" stroke="#6E1A1C" strokeWidth="2" />
    </svg>
  );
}

export function Logo({
  name,
  subtitle,
  size = 40,
  logoUrl,
  invert = false,
}: {
  name: string;
  subtitle?: string;
  size?: number;
  logoUrl?: string | null;
  invert?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" width={size} height={size} className="rounded-lg object-contain" style={{ width: size, height: size }} />
      ) : (
        <LogoMark size={size} />
      )}
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[1.28rem] font-semibold tracking-tight ${invert ? "text-cream" : "text-ink"}`}>{name}</span>
        {subtitle && (
          <span className={`mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] ${invert ? "text-saffron-300" : "text-saffron-700"}`}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
