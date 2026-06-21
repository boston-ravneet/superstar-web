import type { SuperstarBindings } from "@/lib/cloudflare/env";

export function getSessionSecret(bindings: SuperstarBindings): string {
  return bindings.SESSION_SIGNING_SECRET ?? bindings.UPLOAD_SIGNING_SECRET;
}
