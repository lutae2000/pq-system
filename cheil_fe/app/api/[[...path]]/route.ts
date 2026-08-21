import { NextRequest, NextResponse } from "next/server";

const normalizeBaseUrl = (value: string | undefined) => value?.replace(/\/$/, "");

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "x-api-key",
  "x-service-id",
]);

const getBackendTarget = (request: NextRequest, pathSegments: string[] | undefined) => {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_API_BASE_URL);

  if (!baseUrl) {
    return null;
  }

  const target = new URL(pathSegments?.join("/") ?? "", `${baseUrl}/`);
  target.search = request.nextUrl.search;
  return target;
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) => {
  const { path } = await context.params;
  const target = getBackendTarget(request, path);

  if (!target) {
    return NextResponse.json({ message: "NEXT_API_BASE_URL is not configured." }, { status: 500 });
  }

  const headers = new Headers(request.headers);
  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }

  const apiKey = process.env.NEXT_API_KEY ?? "";
  const serviceId = process.env.NEXT_SERVICE_ID ?? "application";

  if (apiKey) {
    headers.set("x-api-key", apiKey);
  }

  if (serviceId) {
    headers.set("x-service-id", serviceId);
  }

  const init: RequestInit = {
    headers,
    method: request.method,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = await fetch(target, init);

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: new Headers(upstreamResponse.headers),
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
