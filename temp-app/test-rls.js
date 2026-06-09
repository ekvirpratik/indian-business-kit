const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agedvffyanqguwlgtugr.supabase.co';
const anonKey = 'sb_publishable_WIoVapOh58oTbIggUMO1lQ_eqCVejgp';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWR2ZmZ5YW5xZ3V3bGd0dWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYwMTA2MSwiZXhwIjoyMDkzMTc3MDYxfQ.pb76Q9yzqZP1SdesVaE3Q9dp5hleU_ntLShN20kqTOc';

const anonClient = createClient(supabaseUrl, anonKey);
const serviceClient = createClient(supabaseUrl, serviceKey);

const CLERK_ID = 'user_3EUpvp4DN4JxJlDhD5zpt9hGmhB';
const EMAIL = 'ekvirpratik@gmail.com';

async function main() {
  console.log('=== Testing subscription access ===\n');

  // 1. What does the service key see?
  console.log('1. SERVICE KEY query (bypasses RLS):');
  const { data: s1, error: e1 } = await serviceClient
    .from('subscriptions')
    .select('*')
    .or(`user_id.eq.${CLERK_ID},email.eq.${EMAIL}`);
  console.log('   Data:', JSON.stringify(s1, null, 2));
  console.log('   Error:', e1);

  // 2. What does the ANON key see? (this is what the app uses!)
  console.log('\n2. ANON KEY query (what the app uses):');
  const { data: s2, error: e2 } = await anonClient
    .from('subscriptions')
    .select('*')
    .or(`user_id.eq.${CLERK_ID},email.eq.${EMAIL}`);
  console.log('   Data:', JSON.stringify(s2, null, 2));
  console.log('   Error:', e2);

  // 3. Diagnosis
  console.log('\n=== DIAGNOSIS ===');
  if (s1?.length > 0 && (!s2 || s2.length === 0)) {
    console.log('❌ RLS IS BLOCKING the anon key! The row exists but the app cannot read it.');
    console.log('   FIX: Go to Supabase Dashboard → Table Editor → subscriptions → RLS');
    console.log('   Either DISABLE RLS or add a SELECT policy with: USING (true)');
  } else if (s2?.length > 0) {
    console.log('✅ Anon key CAN read the subscription. The issue is elsewhere.');
    console.log('   active:', s2[0]?.active);
  } else if (!s1?.length) {
    console.log('❌ No subscription found at all for this user/email.');
  }
}

main().catch(console.error);
