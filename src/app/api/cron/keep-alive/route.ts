import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/keep-alive
 *
 * Lightweight, public endpoint that fires a direct Postgres query (SELECT 1)
 * via Drizzle ORM to reset Supabase's 7-day inactivity auto-pause timer.
 *
 * Design decisions:
 * - No Authorization header required — this is intentionally public and read-only.
 *   It returns no sensitive data (only status + timestamp).
 * - Always returns HTTP 200 so the GitHub Actions workflow never marks as failed.
 * - Uses db.execute(sql`SELECT 1`) which establishes a real TCP Postgres connection,
 *   unlike a REST/PostgREST HTTP ping which may be cached and not reach the DB engine.
 */
export async function GET() {
  try {
    // Direct Postgres-level query — guaranteed to reset Supabase inactivity timer
    await db.execute(sql`SELECT 1`);

    console.log('✅ Supabase keep-alive: Direct DB ping successful.');
    return NextResponse.json({
      status: 'ok',
      message: 'Database keep-alive ping successful.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Log but still return 200 — keep-alive is non-critical; we must not cause
    // GitHub Actions to exit 1 and risk the workflow being auto-disabled by GitHub.
    console.error('❌ Keep-alive DB ping failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'DB ping failed — check Vercel logs for details.',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }
}
