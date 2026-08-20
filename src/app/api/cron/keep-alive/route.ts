import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/keep-alive
 *
 * Dual-layer keep-alive endpoint:
 * 1. Direct Drizzle DB execution (SELECT 1 via TCP)
 * 2. Direct PostgREST HTTP fetch to Supabase API Gateway (rankings table query)
 *
 * Design decision:
 * - Guarantees both DB TCP connections AND Kong API Gateway traffic metrics
 *   are registered by Supabase's 7-day auto-pause monitoring engine.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // 1. Direct Drizzle DB execution via TCP Pooler
  try {
    await db.execute(sql`SELECT 1`);
    results.db = 'ok';
  } catch (error: any) {
    console.error('❌ Keep-alive DB ping error:', error);
    results.db = `failed: ${error?.message || String(error)}`;
  }

  // 2. Direct HTTP request to Supabase PostgREST API Gateway
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llduuesndaxvxvluxull.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_hRZOG5tKpPc0EgQ--Et30Q_92dz7wUw';

    const res = await fetch(`${supabaseUrl}/rest/v1/rankings?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
      cache: 'no-store',
    });

    const status = res.status;
    results.apiGatewayStatus = status;
    results.apiGateway = res.ok ? 'ok' : `http_${status}`;
  } catch (error: any) {
    console.error('❌ Keep-alive API Gateway fetch error:', error);
    results.apiGateway = `failed: ${error?.message || String(error)}`;
  }

  console.log('✅ Supabase dual keep-alive execution details:', results);

  return NextResponse.json({
    status: 'ok',
    message: 'Dual-layer Supabase keep-alive ping executed.',
    details: results,
  });
}

