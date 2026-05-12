const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://agedvffyanqguwlgtugr.supabase.co';
const supabaseKey = 'sb_publishable_WIoVapOh58oTbIggUMO1lQ_eqCVejgp';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase connection...");
  try {
    const { data, error } = await supabase.from('subscriptions').select('count', { count: 'exact', head: true });
    if (error) {
      console.error("API Error from Supabase:", error.message, error.code);
      console.error("HINT: If error says Invalid API Key, then the publishable key is likely wrong!");
    } else {
      console.log("✅ SUCCESS: Successfully connected and queried Supabase!");
    }
  } catch (err) {
    console.error("Crashed connecting:", err.message);
  }
}

test();
