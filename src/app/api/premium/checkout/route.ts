import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { getPremiumPrice, PREMIUM_CURRENCY } from "@/lib/premium";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isUuid } from "@/lib/tournament/types";

const MERCADO_PAGO_PREFERENCES_URL = "https://api.mercadopago.com/checkout/preferences";

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const price = getPremiumPrice();
  const siteUrl = getSiteUrl();

  if (!accessToken || !price) {
    return NextResponse.json(
      { error: "El pago de Premium todavía no está habilitado." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tu sesión expiró. Volvé a ingresar." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tournamentId?: unknown };
  const tournamentId = typeof body.tournamentId === "string" ? body.tournamentId : "";

  if (!isUuid(tournamentId)) {
    return NextResponse.json({ error: "Torneo inválido." }, { status: 400 });
  }

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .select("id, name, is_premium")
    .eq("id", tournamentId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !tournament) {
    return NextResponse.json({ error: "No encontramos ese torneo en tu cuenta." }, { status: 404 });
  }

  if (tournament.is_premium) {
    return NextResponse.json({ error: "Este torneo ya es Premium." }, { status: 409 });
  }

  const panelUrl = `${siteUrl}/panel/torneo/${tournament.id}`;
  const response = await fetch(MERCADO_PAGO_PREFERENCES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      // Same tournament + same price within a session yields the same preference.
      "X-Idempotency-Key": `premium-${tournament.id}-${price}-${user.id}`,
    },
    body: JSON.stringify({
      items: [
        {
          id: "torneospro-premium",
          title: `TorneosPro Premium — ${tournament.name}`.slice(0, 250),
          quantity: 1,
          currency_id: PREMIUM_CURRENCY,
          unit_price: price,
        },
      ],
      external_reference: tournament.id,
      metadata: { tournament_id: tournament.id, owner_id: user.id },
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${panelUrl}?pago=success`,
        failure: `${panelUrl}?pago=failure`,
        pending: `${panelUrl}?pago=pending`,
      },
      auto_return: "approved",
      statement_descriptor: "TORNEOSPRO",
    }),
  });

  if (!response.ok) {
    console.error("Mercado Pago preference error:", response.status, await response.text());
    return NextResponse.json({ error: "No se pudo iniciar el pago." }, { status: 502 });
  }

  const preference = (await response.json()) as { init_point?: string };

  if (!preference.init_point) {
    return NextResponse.json({ error: "Mercado Pago no devolvió el enlace de pago." }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: preference.init_point });
}
