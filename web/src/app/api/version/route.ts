import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Returns the live version and commit deployment hash from Vercel environment
export async function GET() {
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'v2.2-release';
  const deployedAt = process.env.VERCEL_DEPLOYMENT_ID || 'local-build';

  return NextResponse.json({
    status: 'ok',
    version: '2.2.0',
    commitSha: commitSha.substring(0, 7),
    deployedAt,
    timestamp: Date.now()
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    }
  });
}
