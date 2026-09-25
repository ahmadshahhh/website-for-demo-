import Link from "next/link";
import { MenuCard } from "@/components/menu/MenuCard";
import { LinkButton } from "@/components/ui/Button";
import { FoodImage } from "@/components/ui/FoodImage";
import {
  ArrowIcon,
  BagIcon,
  CashIcon,
  ClockIcon,
  FlameIcon,
  PhoneIcon,
  PinIcon,
  ShieldIcon,
  SparkIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { OpeningHours } from "@/components/store/OpeningHours";
import { getFeaturedItems } from "@/lib/data/menu";
import { getDeliveryAreas, getHomepageContent, getSettings } from "@/lib/data/settings";
import { fmt, pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatKWD } from "@/lib/money";

export default async function HomePage() {
  const [{ locale, t }, s, home, featured, areas] = await Promise.all([
    getI18n(),
    getSettings(),
    getHomepageContent(),
    getFeaturedItems(6),
    getDeliveryAreas({ activeOnly: true }),
  ]);
  const name = pick(s, "name", locale);
  const featureIcons = [FlameIcon, SparkIcon, ClockIcon, ShieldIcon];
  const minFee = Math.min(s.deliveryFee, ...areas.map((a) => a.deliveryFee ?? s.deliveryFee));

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-pomegranate-900 text-cream">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(#F2B233 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-saffron-300/30 bg-white/5 px-3 py-1.5 text-sm font-semibold text-saffron-200">
              <span className={`size-2 rounded-full ${s.isOpen ? "bg-emerald-400" : "bg-pomegranate-500"}`} />
              {s.isOpen ? t.status.open : t.status.closed} · {fmt(t.home.deliveryIn, { min: s.deliveryTimeMin, max: s.deliveryTimeMax })}
            </p>
            <h1 className="heading-xl mt-5 text-cream">{pick(home, "heroTitle", locale)}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/80">{pick(home, "tagline", locale)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/menu" size="lg" icon={<BagIcon size={20} />} className="animate-[pulse-ring_2.4s_ease-out_infinite]">
                {t.home.orderNow}
              </LinkButton>
              <LinkButton href="/menu" size="lg" variant="outline" className="border-white/30 bg-white/5 text-cream hover:border-white/50 hover:bg-white/10">
                {t.home.viewMenu} <ArrowIcon size={18} />
              </LinkButton>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm">
              <div>
                <dt className="text-cream/60">{t.checkout.delivery}</dt>
                <dd className="mt-1 font-bold text-saffron-300"><span className="ltr-nums">{s.deliveryTimeMin}–{s.deliveryTimeMax}</span> {t.common.minutes}</dd>
              </div>
              <div>
                <dt className="text-cream/60">{t.checkout.pickup}</dt>
                <dd className="mt-1 font-bold text-saffron-300">~{s.pickupTime} {t.common.minutes}</dd>
              </div>
              <div>
                <dt className="text-cream/60">{t.cart.deliveryFee}</dt>
                <dd className="mt-1 font-bold text-saffron-300">{formatKWD(minFee, locale)}</dd>
              </div>
            </dl>
          </div>
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -inset-4 rotate-2 rounded-[2.2rem] bg-saffron-400/20" />
            <FoodImage src={home.heroImageUrl} alt={name} priority className="relative aspect-[4/3] w-full rounded-[2rem] shadow-2xl ring-1 ring-white/10" />
            <div className="absolute -bottom-5 start-4 flex items-center gap-3 rounded-2xl bg-white p-3 pe-5 text-ink shadow-[var(--shadow-lift)] sm:start-8">
              <span className="flex size-11 items-center justify-center rounded-xl bg-saffron-100 text-saffron-700"><TruckIcon size={22} /></span>
              <span className="text-sm leading-tight">
                <span className="block font-bold">{t.home.deliveryTitle} · {t.home.pickupTitle}</span>
                <span className="text-muted">{fmt(t.home.deliveryEta, { min: s.deliveryTimeMin, max: s.deliveryTimeMax })}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Popular (exactly the 6 featured) ───────── */}
      <section className="container-page pt-16 sm:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">★ {t.menu.popular}</p>
            <h2 className="heading-lg mt-2">{t.home.popularTitle}</h2>
            <p className="mt-2 text-muted">{t.home.popularSubtitle}</p>
          </div>
          <Link href="/menu" className="hidden items-center gap-1.5 font-semibold text-pomegranate-600 hover:gap-2.5 sm:inline-flex transition-all">
            {t.home.viewFullMenu} <ArrowIcon size={18} />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item, i) => (
            <MenuCard key={item.id} item={item} priority={i < 3} />
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <LinkButton href="/menu" size="lg" variant="dark">
            {t.home.viewFullMenu} <ArrowIcon size={18} />
          </LinkButton>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section className="container-page pt-20 sm:pt-24">
        <h2 className="heading-lg text-center">{t.home.featuresTitle}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.features.map((f, i) => {
            const Icon = featureIcons[i] ?? CashIcon;
            return (
              <div key={f.title} className="card p-6">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700">
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-muted">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────── About ───────── */}
      <section className="container-page pt-20 sm:pt-24">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-sand lg:grid-cols-2">
          <FoodImage src={home.aboutImageUrl} alt="" className="aspect-[4/3] h-full w-full" />
          <div className="p-6 pb-10 sm:p-10 lg:ps-0">
            <p className="eyebrow">{t.nav.about}</p>
            <h2 className="heading-lg mt-2">{pick(home, "aboutTitle", locale)}</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">{pick(home, "about", locale)}</p>
            <LinkButton href="/about" variant="outline" className="mt-6">
              {t.home.aboutCta} <ArrowIcon size={18} />
            </LinkButton>
          </div>
        </div>
      </section>

      {/* ───────── Delivery & pickup ───────── */}
      <section className="container-page pt-20 sm:pt-24">
        <h2 className="heading-lg">{t.home.serviceTitle}</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-pomegranate-50 text-pomegranate-600"><TruckIcon size={24} /></span>
              <div>
                <h3 className="text-xl font-bold">{t.home.deliveryTitle}</h3>
                <p className="text-sm text-muted">{fmt(t.home.deliveryEta, { min: s.deliveryTimeMin, max: s.deliveryTimeMax })}</p>
              </div>
            </div>
            {s.deliveryEnabled ? (
              <>
                <p className="mt-4 text-ink-soft">
                  {fmt(t.home.deliveryBody, { count: areas.length, fee: formatKWD(minFee, locale), min: formatKWD(s.minimumOrder, locale) })}
                </p>
                <p className="mt-5 text-sm font-bold text-ink-soft">{t.home.areasTitle}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {areas.map((a) => (
                    <li key={a.id} className="rounded-full bg-sand px-3 py-1 text-sm font-medium">{pick(a, "name", locale)}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 font-medium text-pomegranate-600">{t.home.deliveryOff}</p>
            )}
          </div>
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700"><BagIcon size={24} /></span>
              <div>
                <h3 className="text-xl font-bold">{t.home.pickupTitle}</h3>
                <p className="text-sm text-muted">~{s.pickupTime} {t.common.minutes}</p>
              </div>
            </div>
            {s.pickupEnabled ? (
              <>
                <p className="mt-4 text-ink-soft">{fmt(t.home.pickupBody, { time: s.pickupTime })}</p>
                {s.pickupDiscountPercent > 0 && (
                  <p className="mt-4 inline-flex rounded-xl bg-leaf-50 px-3 py-2 font-bold text-leaf">{fmt(t.home.pickupDiscount, { pct: s.pickupDiscountPercent })}</p>
                )}
              </>
            ) : (
              <p className="mt-4 font-medium text-pomegranate-600">{t.home.pickupOff}</p>
            )}
            <div className="mt-6 flex items-start gap-2.5 text-ink-soft">
              <PinIcon size={20} className="mt-0.5 shrink-0 text-pomegranate-600" />
              <span>{pick(s, "address", locale)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Visit / contact ───────── */}
      <section className="container-page pt-20 sm:pt-24">
        <div className="grid gap-5 rounded-[2rem] bg-ink p-6 text-cream sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="heading-lg text-cream">{t.home.visitTitle}</h2>
            <p className="mt-3 flex items-start gap-2.5 text-cream/80"><PinIcon size={20} className="mt-1 shrink-0 text-saffron-300" />{pick(s, "address", locale)}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {s.phone && (
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-saffron-400 px-5 font-semibold text-ink hover:bg-saffron-300">
                  <PhoneIcon size={18} /> <span className="ltr-nums">{s.phone}</span>
                </a>
              )}
              {s.whatsapp && (
                <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-5 font-semibold hover:bg-white/10">
                  <WhatsAppIcon size={18} /> WhatsApp
                </a>
              )}
              {s.mapsUrl && (
                <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-5 font-semibold hover:bg-white/10">
                  <PinIcon size={18} /> {t.home.getDirections}
                </a>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-white/5 p-5">
            <h3 className="mb-3 font-bold text-saffron-300">{t.home.hours}</h3>
            <OpeningHours hours={s.openingHours} days={t.days} closedLabel={t.status.closed} dark />
          </div>
        </div>
      </section>
    </>
  );
}
