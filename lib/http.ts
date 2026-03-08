import { NextResponse } from 'next/server';

export function ok(data: unknown, requestId: string, status = 200) {
  return NextResponse.json(
    { requestId, data },
    {
      status,
      headers: {
        'x-request-id': requestId,
      },
    },
  );
}

export function fail(message: string, requestId: string, status = 400, code = 'REQUEST_FAILED') {
  return NextResponse.json(
    {
      requestId,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: {
        'x-request-id': requestId,
      },
    },
  );
}
