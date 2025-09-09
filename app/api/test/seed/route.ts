export async function POST() {
  // In CI/tests only: stub endpoint to seed data if needed
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
