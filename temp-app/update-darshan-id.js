const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agedvffyanqguwlgtugr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWR2ZmZ5YW5xZ3V3bGd0dWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYwMTA2MSwiZXhwIjoyMDkzMTc3MDYxfQ.pb76Q9yzqZP1SdesVaE3Q9dp5hleU_ntLShN20kqTOc';

const serviceClient = createClient(supabaseUrl, serviceKey);

const DARSHAN_EMAIL = 'darshan.s.patil08@gmail.com';
const NEW_DARSHAN_CLERK_ID = 'user_3EUZva5nCDkJqAgjeToMJITZkE0';

async function main() {
  console.log('=== Updating Darshan\'s Clerk ID in Supabase ===\n');

  // Step 1: Perform the update
  const { data, error } = await serviceClient
    .from('subscriptions')
    .update({ user_id: NEW_DARSHAN_CLERK_ID })
    .eq('email', DARSHAN_EMAIL)
    .select();

  if (error) {
    console.error('❌ Update failed:', error.message);
  } else {
    console.log('✅ Update successful! Saved record:');
    console.log(JSON.stringify(data, null, 2));
  }

  // Step 2: Show final table state for verification
  console.log('\n📋 Current database subscriptions:');
  const { data: all } = await serviceClient.from('subscriptions').select('*');
  all?.forEach((s, i) => {
    console.log(`  #${i+1}: ${s.email} | user_id: ${s.user_id} | active: ${s.active}`);
  });
}

main().catch(console.error);
