import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Env variables are missing!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase.from("receipts").select("category").limit(1);

if (error) {
  console.error("Error querying category column:", error.message);
} else {
  console.log("Success! Category column exists. Row sample data:", data);
}
