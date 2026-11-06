/**
 * ads.txt authorizes Google to sell inventory on this domain. Without it
 * AdSense limits or withholds demand. Generated from NEXT_PUBLIC_ADSENSE_CLIENT
 * (ca-pub-XXXXXXXX) at build time.
 */
export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const publisherId = client?.replace(/^ca-/, "");

  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# AdSense no configurado\n";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
