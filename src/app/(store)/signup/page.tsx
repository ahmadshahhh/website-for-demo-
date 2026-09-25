import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/AuthForms";
import { LogoMark } from "@/components/ui/Logo";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signupTitle, robots: { index: false } };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ t }, customer, { next: rawNext }] = await Promise.all([getI18n(), getCurrentCustomer(), searchParams]);
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
  if (customer) redirect(next);
  return (
    <div className="container-page max-w-md py-10 sm:py-16">
      <div className="text-center">
        <LogoMark size={52} className="mx-auto" />
        <h1 className="heading-lg mt-4">{t.auth.signupTitle}</h1>
        <p className="mt-2 text-muted">{t.auth.signupSubtitle}</p>
      </div>
      <div className="card mt-8 p-6 sm:p-8">
        <SignupForm next={next} />
      </div>
      {next === "/checkout" && (
        <p className="mt-6 text-center">
          <Link href="/checkout?guest=1" className="font-semibold text-pomegranate-600 hover:underline">{t.auth.continueGuest} →</Link>
        </p>
      )}
    </div>
  );
}
