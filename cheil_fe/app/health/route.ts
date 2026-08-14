export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "cheil_fe",
    timestamp: new Date().toISOString(),
  });
}
