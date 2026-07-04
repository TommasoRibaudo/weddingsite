import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type AdminSupabaseClient = SupabaseClient<Database>;

let _client: AdminSupabaseClient | undefined;

function getInstance() {
  return (_client ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ));
}

export const adminSupabase = new Proxy({} as AdminSupabaseClient, {
  get(_, key) {
    return Reflect.get(getInstance(), key);
  },
});
