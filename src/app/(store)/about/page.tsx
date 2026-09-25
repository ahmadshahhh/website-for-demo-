import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { FoodImage } from "@/components/ui/FoodImage";
import { ArrowIcon } from "@/components/ui/icons";
import { getHomepageContent } from "@/lib/data/settings";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.about.title };
}

export default async function AboutPage() {
  const [{ t, locale }, home] = await Promise.all([getI18n(), getHomepageContent()]);
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">{t.about.title}</p>
          <h1 className="heading-xl mt-3">{pick(home, "aboutTitle", locale)}</h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">{pick(home, "about", locale)}</p>
          <LinkButton href="/menu" size="lg" className="mt-8">{t.home.viewMenu} <ArrowIcon size={18} /></LinkButton>
        </div>
        <FoodImage src={home.aboutImageUrl} alt="" priority className="aspect-[4/3] w-full rounded-[2rem] shadow-[var(--shadow-lift)]" />
      </div>
      <section className="mt-20">
        <h2 className="heading-lg">{t.about.valuesTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {t.about.values.map((v, i) => (
            <div key={v.title} className="card p-6">
              <span className="font-display text-4xl font-bold text-saffron-500">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold">{v.title}</h3>
              <p className="mt-1.5 text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
