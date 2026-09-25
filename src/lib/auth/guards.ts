import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin, getCurrentCustomer } from "./session";

/** For pages: redirect to login when there is no customer session. */
export async function requireCustomerPage(next: string) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return customer;
}

/** For pages: redirect to the admin login when there is no admin session. */
export async function requireAdminPage(opts: { ownerOnly?: boolean } = {}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (opts.ownerOnly && admin.role !== "owner") redirect("/admin");
  return admin;
}

export class AuthError extends Error {}

/** For Server Actions / route handlers: throw instead of redirecting. */
export async function requireAdmin(opts: { ownerOnly?: boolean } = {}) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthError("Not authenticated");
  if (opts.ownerOnly && admin.role !== "owner") throw new AuthError("Not authorised");
  return admin;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new AuthError("Not authenticated");
  return customer;
}
