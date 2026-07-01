import { getAccountById, mapAccountRecord } from "@/lib/db/accounts";
import { jsonError } from "@/lib/api/response";

export async function requireAcceptedTerms(
  db: D1Database,
  accountId: string,
): Promise<Response | null> {
  const account = await getAccountById(db, accountId);
  if (!account) {
    return jsonError("Account not found.", "ACCOUNT_NOT_FOUND", 404);
  }

  const view = mapAccountRecord(account);
  if (view.requiresTermsAcceptance) {
    return jsonError(
      "Accept the Terms & Conditions before building or publishing your stage.",
      "TERMS_REQUIRED",
      403,
    );
  }

  return null;
}
