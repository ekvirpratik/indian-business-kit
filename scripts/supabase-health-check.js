/**
 * Supabase Database Keep-Alive & Health Check Script
 * Designed for GitHub Actions & Local Execution.
 * Compatible with Node.js 18+ (uses native fetch, zero npm dependencies required).
 */

const SUPABASE_URL = (
  process.env.SUPABASE_URL || 'https://agedvffyanqguwlgtugr.supabase.co'
).replace(/\/$/, '');

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWR2ZmZ5YW5xZ3V3bGd0dWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYwMTA2MSwiZXhwIjoyMDkzMTc3MDYxfQ.pb76Q9yzqZP1SdesVaE3Q9dp5hleU_ntLShN20kqTOc';

const DEMO_USER = {
  user_id: 'system_demo_healthcheck_user',
  email: 'healthcheck.bot@indianbusinesskit.com',
  phone: '9999999999',
  name: 'Database Keep-Alive Demo User',
  order_id: 'system_keepalive_heartbeat',
  amount: 0,
  active: true,
  expires_at: '2099-12-31T23:59:59.000Z',
};

async function main() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log('======================================================');
  console.log(`⏰ [${timestamp}] Starting Database Keep-Alive Health Check`);
  console.log(`🎯 Supabase Endpoint: ${SUPABASE_URL}`);
  console.log(`👤 Demo User: ${DEMO_USER.email}`);
  console.log('======================================================');

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation, resolution=merge-duplicates',
  };

  try {
    // 1. Upsert Demo User into `subscriptions` table
    console.log(`\n1️⃣ Ensuring demo user exists in 'subscriptions' table...`);
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=order_id`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...DEMO_USER,
        created_at: new Date().toISOString(),
      }),
    });

    if (!upsertRes.ok) {
      const errText = await upsertRes.text();
      console.warn(`⚠️ Upsert response: ${upsertRes.status} - ${errText}`);
    } else {
      console.log(`✅ Demo user successfully upserted / verified.`);
    }

    // 2. Query demo user by email (active read ping on Postgres)
    console.log(`\n2️⃣ Querying demo user to verify read health...`);
    const queryUrl = `${SUPABASE_URL}/rest/v1/subscriptions?email=eq.${encodeURIComponent(
      DEMO_USER.email
    )}&select=id,user_id,email,name,active,expires_at`;

    const queryRes = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!queryRes.ok) {
      const errText = await queryRes.text();
      throw new Error(`Query failed with status ${queryRes.status}: ${errText}`);
    }

    const userData = await queryRes.json();
    if (!userData || userData.length === 0) {
      throw new Error('Demo user was not returned from the database!');
    }

    // 3. Count query on subscriptions table (engages Postgres engine & index stats)
    console.log(`\n3️⃣ Pinging table head count...`);
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact',
      },
    });

    const totalCount = countRes.headers.get('content-range') || 'available';
    const latencyMs = Date.now() - startTime;

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: Supabase Database is ACTIVE and AWAKE!');
    console.log(`⚡ Response Latency: ${latencyMs}ms`);
    console.log(`📊 Table Content Range / Count: ${totalCount}`);
    console.log(`👤 Verified Demo User ID: ${userData[0].id}`);
    console.log(`🛡️ Account Active: ${userData[0].active}`);
    console.log(`🕒 Verified at: ${new Date().toISOString()}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error(`\n❌ CRITICAL: Database Health Check FAILED after ${latencyMs}ms!`);
    console.error('🚨 Error Details:', error.message || error);
    process.exit(1);
  }
}

main();
