import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const MERCADO_PAGO_PREFERENCES_URL =
  "https://api.mercadopago.com/checkout/preferences";

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const price = Number(process.env.PREMIUM_PRICE_ARS ?? "2500");

  if (!accessToken || !siteUrl || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json(
      { error: "El checkout Premium no está configurado." },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  }

  const body = (await request.json()) as { tournamentId?: unknown };
  const tournamentId =
    typeof body.tournamentId === "string" ? body.tournamentId : "";

  if (!tournamentId) {
    return NextResponse.json(
      { error: "Falta identificar el torneo." },
      { status: 400 },
    );
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name, is_premium")
    .eq("id", tournamentId)
    .eq("owner_id", user.id)
    .single();

  if (tournamentError || !tournament) {
    return NextResponse.json(
      { error: "No se encontró un torneo administrable." },
      { status: 404 },
    );
  }

  if (tournament.is_premium) {
    return NextResponse.json(
      { error: "Este torneo ya tiene Premium activo." },
      { status: 409 },
    );
  }

  const response = await fetch(MERCADO_PAGO_PREFERENCES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: "torneospro-premium",
          title: `Premium - ${tournament.name}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: price,
        },
      ],
      external_reference: tournament.id,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${siteUrl}/dashboard/torneo/${tournament.id}?payment=success`,
        failure: `${siteUrl}/dashboard/torneo/${tournament.id}?payment=failure`,
        pending: `${siteUrl}/dashboard/torneo/${tournament.id}?payment=pending`,
      },
      auto_return: "approved",
    }),
  });

  if (!response.ok) {
    console.error("Mercado Pago preference error:", await response.text());
    return NextResponse.json(
      { error: "No se pudo iniciar el checkout Premium." },
      { status: 502 },
    );
  }

  const preference = (await response.json()) as { init_point?: string };

  if (!preference.init_point) {
    return NextResponse.json(
      { error: "Mercado Pago no devolvió un enlace de checkout." },
      { status: 502 },
    );
  }

  return NextResponse.json({ checkoutUrl: preference.init_point });
}
