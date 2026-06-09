const { createClient } = require('@supabase/supabase-js');

// Use SERVICE ROLE key to bypass RLS
const supabaseUrl = 'https://agedvffyanqguwlgtugr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZWR2ZmZ5YW5xZ3V3bGd0dWdyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYwMTA2MSwiZXhwIjoyMDkzMTc3MDYxfQ.pb76Q9yzqZP1SdesVaE3Q9dp5hleU_ntLShN20kqTOc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Step 1: Show all existing subscriptions
  console.log('\n📋 Current subscriptions in table:');
  console.log('─'.repeat(60));
  const { data: allSubs, error: listErr } = await supabase
    .from('subscriptions')
    .select('*');

  if (listErr) {
    console.error('❌ Error listing subscriptions:', listErr.message);
  } else if (!allSubs || allSubs.length === 0) {
    console.log('   (empty — no subscriptions found)');
  } else {
    allSubs.forEach((s, i) => {
      console.log(`   #${i + 1}:`, JSON.stringify(s, null, 2));
    });
  }
  console.log('─'.repeat(60));

  // Step 2: Upsert the premium user
  const email = 'ekvirpratik@gmail.com';
  const phone = '7020431433';
  const name = 'Pratik Patil';

  console.log(`\n🚀 Creating/updating premium subscription for: ${email}`);

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        email: email,
        phone: phone,
        name: name,
        active: true,
        amount: 2368,
        order_id: 'manual_premium_' + Date.now(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select();

  if (error) {
    console.error('❌ Upsert failed:', error.message, error.details, error.hint);

    // Fallback: try a simple insert if upsert fails (no unique constraint on email)
    console.log('\n🔄 Trying direct insert instead...');
    const { data: insertData, error: insertErr } = await supabase
      .from('subscriptions')
      .insert({
        email: email,
        phone: phone,
        name: name,
        active: true,
        amount: 2368,
        order_id: 'manual_premium_' + Date.now(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      })
      .select();

    if (insertErr) {
      console.error('❌ Insert also failed:', insertErr.message, insertErr.details);
    } else {
      console.log('✅ Inserted successfully:', JSON.stringify(insertData, null, 2));
    }
  } else {
    console.log('✅ Upserted successfully:', JSON.stringify(data, null, 2));
  }

  // Step 3: Verify the subscription exists
  console.log('\n🔍 Verifying subscription for', email, '...');
  const { data: verify, error: verifyErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('email', email);

  if (verifyErr) {
    console.error('❌ Verify failed:', verifyErr.message);
  } else {
    console.log('✅ Found:', JSON.stringify(verify, null, 2));
  }
}

main().catch(console.error);
