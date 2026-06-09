const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agedvffyanqguwlgtugr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWR2ZmZ5YW5xZ3V3bGd0dWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYwMTA2MSwiZXhwIjoyMDkzMTc3MDYxfQ.pb76Q9yzqZP1SdesVaE3Q9dp5hleU_ntLShN20kqTOc';
const anonKey = 'sb_publishable_WIoVapOh58oTbIggUMO1lQ_eqCVejgp';

const serviceClient = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

const PRATIK_CLERK_ID = 'user_3EUpvp4DN4JxJlDhD5zpt9hGmhB';
const PRATIK_EMAIL = 'ekvirpratik@gmail.com';

async function main() {
  // Step 1: Update the subscription with the correct Clerk user_id
  console.log('\n🔧 Step 1: Updating subscription with Clerk user_id...');
  const { data: updated, error: updateErr } = await serviceClient
    .from('subscriptions')
    .update({ user_id: PRATIK_CLERK_ID })
    .eq('email', PRATIK_EMAIL)
    .select();

  if (updateErr) {
    console.error('❌ Update failed:', updateErr.message);
  } else {
    console.log('✅ Updated:', JSON.stringify(updated, null, 2));
  }

  // Step 2: Test reading with the ANON key (same key the app uses)
  console.log('\n🔍 Step 2: Testing read with ANON key (what the app uses)...');
  
  // Test A: Read by user_id
  const { data: byUserId, error: errA } = await anonClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', PRATIK_CLERK_ID);
  console.log('  By user_id:', byUserId?.length ? '✅ Found' : '❌ Empty', errA ? `(Error: ${errA.message})` : '');

  // Test B: Read by email
  const { data: byEmail, error: errB } = await anonClient
    .from('subscriptions')
    .select('*')
    .eq('email', PRATIK_EMAIL);
  console.log('  By email:', byEmail?.length ? '✅ Found' : '❌ Empty', errB ? `(Error: ${errB.message})` : '');

  // Test C: Read with OR (exactly what App.jsx does)
  const { data: byOr, error: errC } = await anonClient
    .from('subscriptions')
    .select('*')
    .or(`user_id.eq.${PRATIK_CLERK_ID},email.eq.${PRATIK_EMAIL}`);
  console.log('  By OR query:', byOr?.length ? '✅ Found' : '❌ Empty/BLOCKED BY RLS', errC ? `(Error: ${errC.message})` : '');
  
  if (byOr && byOr.length > 0) {
    console.log('  Record:', JSON.stringify(byOr[0], null, 2));
  }

  // Step 3: Verify with service key (bypasses RLS) 
  console.log('\n🔐 Step 3: Verifying with SERVICE key (bypasses RLS)...');
  const { data: serviceSub } = await serviceClient
    .from('subscriptions')
    .select('*')
    .eq('email', PRATIK_EMAIL);
  console.log('  Service key result:', serviceSub?.length ? '✅ Found' : '❌ Not found');
  if (serviceSub?.[0]) console.log('  Record:', JSON.stringify(serviceSub[0], null, 2));

  // Diagnosis
  console.log('\n📊 DIAGNOSIS:');
  if (serviceSub?.length && !byOr?.length) {
    console.log('  ⚠️  RLS IS BLOCKING the anon key from reading subscriptions!');
    console.log('  FIX: You need to add an RLS policy or disable RLS on the subscriptions table.');
    console.log('  Go to: Supabase Dashboard → Table Editor → subscriptions → RLS Policies');
    console.log('  Add policy: "Allow read access for all" with USING clause: true');
  } else if (byOr?.length) {
    console.log('  ✅ Everything looks good — subscription is readable!');
  } else {
    console.log('  ❌ Subscription not found at all — check the data.');
  }

  // Show ALL subscriptions for reference
  console.log('\n📋 All subscriptions in table:');
  const { data: all } = await serviceClient.from('subscriptions').select('*');
  all?.forEach((s, i) => console.log(`  #${i+1}: ${s.email} | user_id: ${s.user_id} | active: ${s.active}`));
}

main().catch(console.error);
