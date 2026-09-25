import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/menu/SearchView";
import { getMenu } from "@/lib/data/menu";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.search.title };
}

export default async function SearchPage() {
  const [{ t }, menu] = await Promise.all([getI18n(), getMenu()]);
  return (
    <div className="container-page max-w-5xl py-8 sm:py-12">
      <h1 className="heading-lg">{t.search.title}</h1>
      <Suspense>
        <SearchView items={menu.items} popularIds={menu.popularIds} />
      </Suspense>
    </div>
  );
}
