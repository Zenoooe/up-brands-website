import { createClient } from '@supabase/supabase-js';
import { Converter } from 'opencc-js/cn2t';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const convertToTraditional = Converter({ from: 'cn', to: 'tw' });

async function main() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, description, description_tw')
    .not('description', 'is', null);

  if (error) {
    throw error;
  }

  const rowsToUpdate = (projects ?? []).filter((project) => {
    const description = project.description?.trim();
    const descriptionTw = project.description_tw?.trim();
    return description && !descriptionTw;
  });

  if (rowsToUpdate.length === 0) {
    console.log('No project descriptions need backfill.');
    return;
  }

  let updatedCount = 0;

  for (const project of rowsToUpdate) {
    const descriptionTw = convertToTraditional(project.description);
    const { error: updateError } = await supabase
      .from('projects')
      .update({ description_tw: descriptionTw })
      .eq('id', project.id);

    if (updateError) {
      throw updateError;
    }

    updatedCount += 1;
  }

  console.log(`Backfilled description_tw for ${updatedCount} project(s).`);
}

main().catch((error) => {
  console.error('Failed to backfill project descriptions:', error);
  process.exit(1);
});
