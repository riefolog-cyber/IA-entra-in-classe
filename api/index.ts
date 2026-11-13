export default async function handler(req: Request) {
  const url = new URL(req.url);
  if (url.pathname === "/api/health") {
    return Response.json({ status: "ok" });
  }
  return new Response("Not found", { status: 404 });
}
