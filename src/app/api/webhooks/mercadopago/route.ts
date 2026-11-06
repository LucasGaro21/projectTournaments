import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { PUBLIC_TOURNAMENTS_TAG, tournamentTag } from "@/lib/data/tags";
import { getPremiumPrice, PREMIUM_CURRENCY } from "@/lib/premium";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { isUuid } from "@/lib/tournament/types";

const MERCADO_PAGO_PAYMENTS_URL = "https://api.mercadopago.com/v1/payments";
const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

/** Verifies Mercado Pago's `x-signature` header (HMAC-SHA256 of the manifest). */
function isValidSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string,
  secret: string,
): boolean {
  if (!signature || !requestId || !dataId) return false;

  const parts = new Map(
    signature.split(",").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value] as const;
    }),
  );
  const timestamp = parts.get("ts");
  const received = parts.get("v1");

  if (!timestamp || !received || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() - Number(timestamp) * 1000) > MAX_SIGNATURE_AGE_MS) return false;

  // Mercado Pago signs alphanumeric ids in lowercase.
  const manifest = `id=${dataId.toLowerCase()};request-id=${requestId};ts=${timestamp};`;
  const expected = Buffer.from(createHmac("sha256", secret).update(manifest).digest("hex"));
  const actual = Buffer.from(received);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

type MercadoPagoPayment = {
  id?: number | string;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  currency_id?: string;
};

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (!accessToken || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const paymentId = url.searchParams.get("data.id") ?? "";
  const topic = url.searchParams.get("type");

  if (
    !isValidSignature(
      request.headers.get("x-signature"),
      request.headers.get("x-request-id"),
      paymentId,
      webhookSecret,
    )
  ) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const notification = (await request.json().catch(() => ({}))) as { type?: string };
  if ((notification.type ?? topic) !== "payment") {
    return NextResponse.json({ received: true });
  }

  // Never trust the notification body: fetch the payment from Mercado Pago.
  const paymentResponse = await fetch(
    `${MERCADO_PAGO_PAYMENTS_URL}/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!paymentResponse.ok) {
    console.error("Mercado Pago payment lookup failed:", paymentResponse.status);
    // 5xx makes Mercado Pago retry later.
    return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 502 });
  }

  const payment = (await paymentResponse.json()) as MercadoPagoPayment;
  const tournamentId = payment.external_reference ?? "";
  const supabase = createSupabaseAdminClient();

  const { error: ledgerError } = await supabase.from("payments").upsert({
    id: String(payment.id ?? paymentId),
    tournament_id: isUuid(tournamentId) ? tournamentId : null,
    status: payment.status ?? "unknown",
    amount: payment.transaction_amount ?? null,
    currency: payment.currency_id ?? null,
    updated_at: new Date().toISOString(),
  });

  if (ledgerError) {
    console.error("Could not record payment:", ledgerError.message);
    return NextResponse.json({ error: "No se pudo registrar el pago." }, { status: 500 });
  }

  const expectedPrice = getPremiumPrice();
  const amountIsValid =
    expectedPrice !== null &&
    payment.currency_id === PREMIUM_CURRENCY &&
    typeof payment.transaction_amount === "number" &&
    payment.transaction_amount >= expectedPrice;

  if (payment.status !== "approved" || !isUuid(tournamentId)) {
    return NextResponse.json({ received: true });
  }

  if (!amountIsValid) {
    console.error("Approved payment with unexpected amount", {
      paymentId,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
    });
    return NextResponse.json({ received: true });
  }

  const { error } = await supabase
    .from("tournaments")
    .update({ is_premium: true, premium_activated_at: new Date().toISOString() })
    .eq("id", tournamentId)
    .eq("is_premium", false);

  if (error) {
    console.error("Error activating Premium:", error.message);
    return NextResponse.json({ error: "No se pudo activar Premium." }, { status: 500 });
  }

  revalidateTag(tournamentTag(tournamentId), { expire: 0 });
  revalidateTag(PUBLIC_TOURNAMENTS_TAG, "max");

  return NextResponse.json({ received: true });
}
