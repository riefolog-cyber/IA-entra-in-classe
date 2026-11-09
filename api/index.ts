export default async function handler(req: Request) {
  const url = new URL(req.url);
  if (url.pathname === "/api/health") {
    return Response.json({ status: "ok" });
  }
  if (url.pathname === "/api/rpc/analyzeProfile") {
    return Response.json({ ok: false, message: "Not implemented in this test" });
  }
  return new Response("Not found", { status: 404 });
}