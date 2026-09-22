import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://sbnnpbtvdvggpqesohxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibm5wYnR2ZHZnZ3BxZXNvaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzAyODIsImV4cCI6MjA4NTUwNjI4Mn0.fwnSWv-16PViCKdilH8We3F4aKX1xO47OjUkrkUzLZQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newIndustries = [
  { en: "FMCG", zh: "快消品", showInFilter: true },
  { en: "Beauty & Cosmetics", zh: "美妆个护", showInFilter: true },
  { en: "Tech & Electronics", zh: "科技与电子", showInFilter: true },
  { en: "Lifestyle & Leisure", zh: "生活方式", showInFilter: true },
  { en: "Healthcare & Pharma", zh: "医疗与大健康", showInFilter: true },
  { en: "Food & Beverage", zh: "食品餐饮", showInFilter: true },
  { en: "Hospitality & Travel", zh: "酒店与文旅", showInFilter: true },
  { en: "Automotive & Mobility", zh: "汽车与出行", showInFilter: true },
  { en: "Real Estate & Architecture", zh: "地产与建筑", showInFilter: true },
  { en: "Finance & Fintech", zh: "金融与金融科技", showInFilter: true },
  { en: "Fashion & Apparel", zh: "时尚与服饰", showInFilter: true },
  { en: "Retail & E-commerce", zh: "零售与电商", showInFilter: true },
  { en: "Culture & Arts", zh: "文化与艺术", showInFilter: true }
];

async function fix() {
  const { data: existing } = await supabase.from('settings').select('*').eq('key', 'industries_list').maybeSingle();
  if (existing) {
    const { error } = await supabase.from('settings').update({ value: newIndustries }).eq('key', 'industries_list');
    console.log("Update error:", error);
  } else {
    const { error } = await supabase.from('settings').insert({ key: 'industries_list', value: newIndustries });
    console.log("Insert error:", error);
  }
  
  const { data: verify } = await supabase.from('settings').select('*').eq('key', 'industries_list').maybeSingle();
  console.log("Verified length:", verify?.value?.length);
}
fix();