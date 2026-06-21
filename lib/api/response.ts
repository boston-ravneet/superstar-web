import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@/lib/types/profile";

export function jsonError(
  message: string,
  code: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code }, { status });
}

export function jsonOk<T>(payload: T, status = 200): NextResponse<T> {
  return NextResponse.json(payload, { status });
}
