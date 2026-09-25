import "@fontsource-variable/fraunces";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/cairo";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { CartProvider } from "@/components/providers/CartProvider";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { dirOf } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { siteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t.meta.title, template: `%s · ${t.common.brand}` },
    description: t.meta.description,
    openGraph: { title: t.meta.title, description: t.meta.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#9E2A2B",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  return (
    <html lang={locale} dir={dirOf(locale)} data-scroll-behavior="smooth">
      <body className="min-h-dvh">
        <I18nProvider locale={locale} t={t}>
          <ToastProvider>
            <CartProvider>{children}</CartProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
