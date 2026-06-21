import { jsonOk } from "@/lib/api/response";
import { getRecentStageGenerationLogs } from "@/lib/ai/stage-generation-log";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk({
    logs: getRecentStageGenerationLogs(),
  });
}
