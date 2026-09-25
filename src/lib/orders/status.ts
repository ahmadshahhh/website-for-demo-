import type { OrderStatus } from "@/db/schema";

export type OrderType = "delivery" | "pickup";

/** The happy-path sequence for each order type. */
export const STATUS_FLOW: Record<OrderType, OrderStatus[]> = {
  delivery: ["received", "accepted", "preparing", "ready", "out_for_delivery", "delivered"],
  pickup: ["received", "accepted", "preparing", "ready", "picked_up"],
};

export const FINAL_STATUSES: OrderStatus[] = ["delivered", "picked_up", "cancelled"];
export const ACTIVE_STATUSES: OrderStatus[] = ["accepted", "preparing", "ready", "out_for_delivery"];

export const isFinal = (s: OrderStatus) => FINAL_STATUSES.includes(s);

export function nextStatus(type: OrderType, current: OrderStatus): OrderStatus | null {
  const flow = STATUS_FLOW[type];
  const i = flow.indexOf(current);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

/** Admin may move an order to any later step of its own flow, or cancel it. */
export function canTransition(type: OrderType, from: OrderStatus, to: OrderStatus): boolean {
  if (isFinal(from)) return false;
  if (to === "cancelled") return true;
  const flow = STATUS_FLOW[type];
  const a = flow.indexOf(from);
  const b = flow.indexOf(to);
  return a >= 0 && b > a;
}

/**
 * Dictionary key for a status label. "ready" reads "Ready for Pickup" on
 * pickup orders.
 */
export function statusKey(type: OrderType, status: OrderStatus) {
  return status === "ready" && type === "pickup" ? "readyPickup" : status;
}
