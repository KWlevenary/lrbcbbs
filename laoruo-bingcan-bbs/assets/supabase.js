import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const SUPABASE_URL = 'https://lnfjgsycfevgrxhgefoi.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_7LpIAS78VIY_DD1LJhraLg_-QlBqyRM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)