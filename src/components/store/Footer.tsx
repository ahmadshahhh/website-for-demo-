import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import type { PublicSettings } from "@/lib/data/settings";
import { pick, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function Footer({ s, t, locale }: { s: PublicSettings; t: Dictionary; locale: Locale }) {
  const name = pick(s, "name", locale);
  const year = new Date().getFullYear();
  const col = "space-y-2.5 text-[0.95rem]";
  const link = "text-cream/75 hover:text-saffron-300 transition-colors";
  return (
    <footer className="mt-24 bg-pomegranate-900 text-cream no-print">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="space-y-4">
          <Logo name={name} logoUrl={s.logoUrl} invert size={42} />
          <p className="max-w-xs text-cream/70">{t.footer.tagline}</p>
          <LanguageSwitcher variant="dark" />
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-saffron-300">{t.footer.explore}</h3>
          <ul className={col}>
            <li><Link className={link} href="/menu">{t.nav.menu}</Link></li>
            <li><Link className={link} href="/search">{t.nav.search}</Link></li>
            <li><Link className={link} href="/about">{t.nav.about}</Link></li>
            <li><Link className={link} href="/contact">{t.nav.contact}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-saffron-300">{t.footer.help}</h3>
          <ul className={col}>
            <li><Link className={link} href="/track">{t.nav.track}</Link></li>
            <li><Link className={link} href="/account/orders">{t.nav.orders}</Link></li>
            <li><Link className={link} href="/account">{t.nav.account}</Link></li>
            <li><Link className={link} href="/cart">{t.nav.cart}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-saffron-300">{t.footer.visit}</h3>
          <ul className={col}>
            <li className="flex gap-2.5 text-cream/75"><PinIcon size={18} className="mt-1 shrink-0 text-saffron-300" /><a className={link} href={s.mapsUrl} target="_blank" rel="noreferrer">{pick(s, "address", locale)}</a></li>
            {s.phone && <li className="flex gap-2.5"><PhoneIcon size={18} className="mt-0.5 shrink-0 text-saffron-300" /><a className={`${link} ltr-nums`} href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a></li>}
            {s.whatsapp && <li className="flex gap-2.5"><WhatsAppIcon size={18} className="mt-0.5 shrink-0 text-saffron-300" /><a className={link} href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a></li>}
            {s.email && <li className="flex gap-2.5"><MailIcon size={18} className="mt-0.5 shrink-0 text-saffron-300" /><a className={`${link} ltr-nums`} href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.instagram && <li className="flex gap-2.5"><InstagramIcon size={18} className="mt-0.5 shrink-0 text-saffron-300" /><a className={`${link} ltr-nums`} href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">@{s.instagram.replace(/^@/, "")}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-sm text-cream/55 sm:flex-row">
          <p>© {year} {name}. {t.footer.rights}</p>
          <Link href="/admin" className="hover:text-cream">{t.footer.staff}</Link>
        </div>
      </div>
    </footer>
  );
}
