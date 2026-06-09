const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agedvffyanqguwlgtugr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWR2ZmZ5YW5xZ3V3bGd0dWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYwMTA2MSwiZXhwIjoyMDkzMTc3MDYxfQ.pb76Q9yzqZP1SdesVaE3Q9dp5hleU_ntLShN20kqTOc';
const anonKey = 'sb_publishable_WIoVapOh58oTbIggUMO1lQ_eqCVejgp';

const serviceClient = createClient(supabaseUrl, serviceKey);
const anonClient = createClient(supabaseUrl, anonKey);

const CLERK_ID = 'user_3EUZva5nCDkJqAgjeToMJITZkE0';

async function main() {
  console.log('=== Checking Subscription database status ===\n');

  // 1. Let's find all subscriptions in the table to see if our user exists
  const { data: allSubs, error: listErr } = await serviceClient
    .from('subscriptions')
    .select('*');

  if (listErr) {
    console.error('❌ Error listing subscriptions:', listErr.message);
    return;
  }

  console.log(`📋 Total subscriptions found in database: ${allSubs.length}`);
  allSubs.forEach((sub, i) => {
    console.log(`\nSubscription #${i+1}:`);
    console.log(`   ID: ${sub.id}`);
    console.log(`   User ID: ${sub.user_id}`);
    console.log(`   Email: ${sub.email}`);
    console.log(`   Name: ${sub.name}`);
    console.log(`   Active: ${sub.active}`);
    console.log(`   Expires: ${sub.expires_at}`);
  });

  // 2. Search specifically for the user ID
  console.log('\n🔍 Searching for user ID matching:', CLERK_ID);
  const matchedById = allSubs.filter(s => s.user_id === CLERK_ID);
  console.log(`   Matches by User ID: ${matchedById.length}`);

  // 3. Test what the ANON key sees for this user
  console.log('\n🕵️ Checking if the public ANON key can read this data (RLS test):');
  const { data: anonData, error: anonErr } = await anonClient
    .from('subscriptions')
    .select('*')
    .or(`user_id.eq.${CLERK_ID}`);

  if (anonErr) {
    console.error('   Anon read error:', anonErr.message);
  } else {
    console.log(`   Anon read returned ${anonData.length} records.`);
    if (anonData.length === 0 && allSubs.some(s => s.user_id === CLERK_ID || s.email)) {
      console.log('   ⚠️ WARNING: The subscription exists in the database, but the public app cannot read it because RLS is blocking it!');
    }
  }
}

main().catch(console.error);
