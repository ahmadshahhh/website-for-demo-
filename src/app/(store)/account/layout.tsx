import { AccountNav } from "@/components/account/AccountNav";
import { requireCustomerPage } from "@/lib/auth/guards";
import { fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

/** Every /account page requires a signed-in customer. */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [{ t }, customer] = await Promise.all([getI18n(), requireCustomerPage("/account")]);
  return (
    <div className="container-page py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t.account.title}</p>
          <h1 className="heading-lg mt-1">{fmt(t.account.hello, { name: customer.name.split(" ")[0] })}</h1>
        </div>
      </div>
      <AccountNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
