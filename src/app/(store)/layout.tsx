import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { MobileCartBar } from "@/components/store/MobileCartBar";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getSettings, toPublicSettings } from "@/lib/data/settings";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [{ locale, t }, settings, customer] = await Promise.all([getI18n(), getSettings(), getCurrentCustomer()]);
  const s = toPublicSettings(settings);
  const closedMsg = pick(s, "closedMessage", locale) || t.status.closedBanner;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
        {t.common.skipToContent}
      </a>
      {!s.isOpen && (
        <div className="bg-pomegranate-600 px-4 py-2.5 text-center text-sm font-semibold text-white no-print" role="status">
          {closedMsg}
        </div>
      )}
      <Header name={pick(s, "name", locale)} logoUrl={s.logoUrl} isOpen={s.isOpen} signedIn={!!customer} />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer s={s} t={t} locale={locale} />
      <MobileCartBar />
    </>
  );
}
