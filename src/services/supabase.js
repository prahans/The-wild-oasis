import { createClient } from "@supabase/supabase-js";
export const supabaseUrl = "https://etdppexytxobduexwgzy.supabase.co";
const supabaseKey = "sb_publishable_FVYjNvobmITfgRvtXX_iIg_ct5GiONC";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
