import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { getMenu } from "@/lib/data/menu";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.menu.title };
}

export default async function MenuPage() {
  const [{ t }, menu] = await Promise.all([getI18n(), getMenu()]);
  return (
    <div className="container-page py-8 sm:py-10">
      <header className="mb-2">
        <h1 className="heading-lg">{t.menu.title}</h1>
        <p className="mt-2 text-muted">{t.menu.subtitle}</p>
      </header>
      <Suspense>
        <MenuBrowser categories={menu.categories} items={menu.items} popularIds={menu.popularIds} />
      </Suspense>
    </div>
  );
}
