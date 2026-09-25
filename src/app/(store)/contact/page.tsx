import type { Metadata } from "next";
import { OpeningHours } from "@/components/store/OpeningHours";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { getSettings } from "@/lib/data/settings";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.contact.title };
}

export default async function ContactPage() {
  const [{ t, locale }, s] = await Promise.all([getI18n(), getSettings()]);
  const ig = s.instagram.replace(/^@/, "");
  const cards = [
    s.phone && { Icon: PhoneIcon, label: t.contact.phone, value: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}`, ltr: true },
    s.whatsapp && { Icon: WhatsAppIcon, label: t.contact.whatsapp, value: `+${s.whatsapp}`, href: `https://wa.me/${s.whatsapp}`, ltr: true },
    s.email && { Icon: MailIcon, label: t.contact.email, value: s.email, href: `mailto:${s.email}`, ltr: true },
    ig && { Icon: InstagramIcon, label: t.contact.instagram, value: `@${ig}`, href: `https://instagram.com/${ig}`, ltr: true },
  ].filter(Boolean) as { Icon: typeof PhoneIcon; label: string; value: string; href: string; ltr: boolean }[];

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="heading-xl">{t.contact.title}</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">{t.contact.subtitle}</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map(({ Icon, label, value, href, ltr }) => (
              <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-[var(--shadow-lift)]">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700"><Icon size={22} /></span>
                <span>
                  <span className="block text-sm text-muted">{label}</span>
                  <span className={`block font-bold ${ltr ? "ltr-nums" : ""}`}>{value}</span>
                </span>
              </a>
            ))}
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><PinIcon size={20} className="text-pomegranate-600" /> {t.contact.address}</h2>
            <p className="mt-2 text-ink-soft">{pick(s, "address", locale)}</p>
            {s.mapsUrl && (
              <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 font-semibold text-cream hover:bg-ink-soft">
                <PinIcon size={18} /> {t.contact.map}
              </a>
            )}
            <p className="mt-6 rounded-xl bg-sand p-3 text-sm text-ink-soft">{t.contact.orderHelp}</p>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="mb-4 text-lg font-bold">{t.contact.hours}</h2>
          <OpeningHours hours={s.openingHours} days={t.days} closedLabel={t.status.closed} />
        </div>
      </div>
    </div>
  );
}
