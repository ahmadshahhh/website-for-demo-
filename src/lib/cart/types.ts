/** What the browser keeps in its cart. Prices are never trusted from here. */
export type CartLineInput = { itemId: number; quantity: number; optionIds: number[] };

/** Display snapshot stored alongside a line for instant rendering. */
export type CartLine = CartLineInput & {
  key: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
  /** Unit price at the time it was added (display only; server recalculates). */
  unitPrice: number;
  optionNamesEn: string[];
  optionNamesAr: string[];
};

export const MAX_QTY = 50;
export const MAX_LINES = 40;

export const lineKey = (itemId: number, optionIds: number[]) =>
  `${itemId}:${[...optionIds].sort((a, b) => a - b).join(",")}`;

export type QuotedLine = {
  key: string;
  itemId: number;
  quantity: number;
  optionIds: number[];
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
  optionNamesEn: string[];
  optionNamesAr: string[];
  unitPrice: number;
  lineTotal: number;
  problem: null | "unavailable" | "options";
};

export type Quote = {
  lines: QuotedLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  minimumOrder: number;
  belowMinimum: boolean;
  hasProblems: boolean;
};
