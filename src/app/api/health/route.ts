export async function GET() {
  return Response.json({
    service: "PK-LASER-OS",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
