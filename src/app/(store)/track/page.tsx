import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/order/TrackForm";
import { TruckIcon } from "@/components/ui/icons";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.track.title };
}

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const [{ t }, customer, { id }] = await Promise.all([getI18n(), getCurrentCustomer(), searchParams]);
  return (
    <div className="container-page max-w-xl py-10 sm:py-16">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700">
          <TruckIcon size={30} />
        </span>
        <h1 className="heading-lg mt-5">{t.track.title}</h1>
        <p className="mt-2 text-muted">{t.track.subtitle}</p>
      </div>
      <div className="card mt-8 p-6 sm:p-8">
        <TrackForm defaultId={id?.slice(0, 20) ?? ""} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        {customer ? (
          <Link href="/account/orders" className="font-semibold text-pomegranate-600 hover:underline">{t.nav.orders} →</Link>
        ) : (
          <>
            {t.track.signedInHint}{" "}
            <Link href="/login?next=/account/orders" className="font-semibold text-pomegranate-600 hover:underline">{t.nav.login}</Link>
          </>
        )}
      </p>
    </div>
  );
}
