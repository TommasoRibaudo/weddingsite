import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | undefined;

function getInstance() {
  return (_client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  ));
}

export const adminSupabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, key) {
    return Reflect.get(getInstance(), key);
  },
});
