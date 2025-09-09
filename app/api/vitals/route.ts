export async function POST(req: Request) {
  // Accept RUM web-vitals payload
  try {
    const body = await req.json();
    // In production, send to analytics pipeline; for now, no-op
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }
}
