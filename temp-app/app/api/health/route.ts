import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Prevent caching to guarantee a live database ping every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEMO_USER_EMAIL = 'healthcheck.bot@indianbusinesskit.com';

export async function GET() {
  const startTime = Date.now();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Supabase credentials are not configured in environment variables.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    // 1. Actively query the demo health check user
    const { data: user, error: userError } = await supabase
      .from('subscriptions')
      .select('id, user_id, email, name, active, expires_at')
      .eq('email', DEMO_USER_EMAIL)
      .limit(1)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    // 2. Query exact count to touch Postgres indexes & table
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        database: 'connected',
        latency_ms: latencyMs,
        demo_user: {
          id: user?.id || null,
          email: DEMO_USER_EMAIL,
          exists: !!user,
          active: user?.active ?? false,
        },
        total_records: count ?? 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'error',
        latency_ms: latencyMs,
        error: err?.message || 'Unknown database error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
