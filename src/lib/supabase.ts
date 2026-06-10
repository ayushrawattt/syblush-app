import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wekcyqtvnlgojcjtazow.supabase.co";

const supabaseAnonKey =
"sb_publishable_iQtyoBOSbH9vy7bbCTNwGw_SMmqp772";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);