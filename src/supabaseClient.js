import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


/** Cliente de Supabase inicializado para interactuar con la base de datos */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);