import { NextResponse } from 'next/server';
import { typescriptSdkSnippet } from '@/lib/sdk';

export async function GET() {
  return NextResponse.json({ language: 'typescript', sdkSnippet: typescriptSdkSnippet });
}
