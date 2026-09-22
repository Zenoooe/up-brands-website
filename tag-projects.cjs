require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: servicesData } = await supabase.from('settings').select('*').eq('key', 'services_hierarchy').single();
  const { data: industriesData } = await supabase.from('settings').select('*').eq('key', 'industries_list').single();
  
  console.log('Services:', JSON.stringify(servicesData?.value, null, 2));
  console.log('Industries:', JSON.stringify(industriesData?.value, null, 2));
}
main();
