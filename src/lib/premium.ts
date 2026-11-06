import "server-only";

export const PREMIUM_CURRENCY = "ARS";

/** Price of Premium per tournament, in ARS. */
export function getPremiumPrice(): number | null {
  const price = Number(process.env.PREMIUM_PRICE_ARS ?? "2500");
  return Number.isFinite(price) && price > 0 ? price : null;
}
