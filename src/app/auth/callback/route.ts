import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const redirectPath = next?.startsWith("/") ? next : "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("No se pudo confirmar la sesión:", error);
    return NextResponse.redirect(new URL("/login?error=confirmation_failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
