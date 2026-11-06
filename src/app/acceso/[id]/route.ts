import { NextResponse, type NextRequest } from "next/server";
import { rememberToken, tokenMatches } from "@/lib/admin-access";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { isUuid } from "@/lib/tournament/types";

/**
 * Admin link: /acceso/<id>?clave=<token>. Validates the token, stores it in
 * this device's cookie and opens the management page. The token is removed
 * from the URL right away so it does not stay in the history bar.
 */
export async function GET(request: NextRequest, context: RouteContext<"/acceso/[id]">) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("clave");
  const target = new URL(`/gestionar/${id}`, request.url);

  if (!isUuid(id) || !token || !isSupabaseConfigured()) {
    target.searchParams.set("error", "enlace");
    return NextResponse.redirect(target);
  }

  const { data } = await createSupabaseAdminClient()
    .from("tournaments")
    .select("admin_token_hash")
    .eq("id", id)
    .maybeSingle();

  if (!tokenMatches(token, data?.admin_token_hash ?? null)) {
    target.searchParams.set("error", "enlace");
    return NextResponse.redirect(target);
  }

  await rememberToken(id, token);
  return NextResponse.redirect(target);
}
