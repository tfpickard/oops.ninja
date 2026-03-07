import { NextResponse } from 'next/server';

export function ok(data: unknown, requestId: string) {
  return NextResponse.json({ requestId, data });
}

export function fail(message: string, requestId: string, status = 400) {
  return NextResponse.json({ requestId, error: { message } }, { status });
}
