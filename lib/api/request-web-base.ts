export function getRequestWebBase(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
