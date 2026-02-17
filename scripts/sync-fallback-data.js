import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars from .env file
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncFallbackData() {
  console.log('🔄 Fetching latest project data from Supabase...');

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .or('is_visible.eq.true,is_visible.is.null')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('❌ Error fetching projects:', error);
      process.exit(1);
    }

    if (!projects || projects.length === 0) {
      console.warn('⚠️ No projects found in database.');
      return;
    }

    console.log(`✅ Found ${projects.length} projects.`);

    // Format data as TypeScript code
    const fileContent = `import type { Project } from '../types';

// Fallback data for instant loading and offline resilience
// Generated automatically by scripts/sync-fallback-data.js
// Last updated: ${new Date().toISOString()}

export const fallbackProjects: Project[] = ${JSON.stringify(projects, null, 2)};
`;

    const outputPath = path.resolve(__dirname, '../src/data/fallbackProjects.ts');
    
    fs.writeFileSync(outputPath, fileContent);
    
    console.log(`✅ Successfully updated fallback data at: ${outputPath}`);
    console.log('👉 This data will now be used for instant loading (Optimistic UI).');

  } catch (e) {
    console.error('❌ Exception during sync:', e);
    process.exit(1);
  }
}

syncFallbackData();
