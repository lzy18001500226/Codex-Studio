import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return NextResponse.json({ error: message }, { status });
}
