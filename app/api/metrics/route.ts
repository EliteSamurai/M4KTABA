import { exposeMetrics } from "@/lib/metrics";

export async function GET() {
  const body = exposeMetrics();
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/plain; version=0.0.4; charset=utf-8" },
  });
}
