import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com/v1/payments";

function createMagicLinkToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function isValidWebhookSignature(
  signature: string | null,
  requestId: string | null,
  dataId: string,
  secret: string,
) {
  if (!signature || !requestId || !dataId) return false;

  const signatureParts = new Map(
    signature.split(",").map((part) => {
      const [key, value] = part.trim().split("=", 2);
      return [key, value];
    }),
  );
  const timestamp = signatureParts.get("ts");
  const receivedHash = signatureParts.get("v1");

  if (!timestamp || !receivedHash || !/^\d+$/.test(timestamp)) return false;

  const timestampAge = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (timestampAge > 5 * 60 * 1000) return false;

  const manifest = `id=${dataId};request-id=${requestId};ts=${timestamp};`;
  const expectedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");
  const receivedBuffer = Buffer.from(receivedHash, "utf8");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (!accessToken || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const notificationDataId = requestUrl.searchParams.get("data.id");
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const requestBody = (await request.json()) as {
    type?: string;
    data?: { id?: string };
    action?: string;
  };
  const paymentId = notificationDataId;

  if (
    !paymentId ||
    !isValidWebhookSignature(
      signature,
      requestId,
      paymentId,
      webhookSecret,
    )
  ) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const notification = requestBody;

  if (
    notification.type !== "payment" ||
    !paymentId ||
    (notification.action &&
      !["payment.created", "payment.updated"].includes(notification.action))
  ) {
    return NextResponse.json({ received: true });
  }

  const paymentResponse = await fetch(`${MERCADO_PAGO_API_URL}/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!paymentResponse.ok) {
    console.error("Mercado Pago payment lookup failed:", await paymentResponse.text());
    return NextResponse.json({ error: "No se pudo verificar el pago." }, { status: 502 });
  }

  const payment = (await paymentResponse.json()) as {
    status?: string;
    external_reference?: string;
  };

  if (payment.status !== "approved" || !payment.external_reference) {
    return NextResponse.json({ received: true });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("tournaments")
    .update({
      is_premium: true,
      magic_link_token: createMagicLinkToken(),
    })
    .eq("id", payment.external_reference)
    .eq("is_premium", false);

  if (error) {
    console.error("Error activating Premium after payment:", error);
    return NextResponse.json(
      { error: "No se pudo activar Premium." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
