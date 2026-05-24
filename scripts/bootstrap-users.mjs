// Creates the demo auth users in Supabase using the service-role key.
// Usage:  node --env-file=.env.local scripts/bootstrap-users.mjs
//
// Requires Node 20.6+ (for --env-file).  Use the service-role key only locally.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Run with:  node --env-file=.env.local scripts/bootstrap-users.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = "Gsi#Demo2026";

const users = [
  "superadmin@gsi.local",
  "admin@gsi.local",
  "finance@gsi.local",
  "purchasing@gsi.local",
  "warehouse@gsi.local",
  "pm@gsi.local",
  "tech1@gsi.local",
  "tech2@gsi.local",
  "employee@gsi.local",
  "ceo@gsi.local",
];

for (const email of users) {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error && !String(error.message).toLowerCase().includes("already")) {
    console.error(`x ${email}: ${error.message}`);
  } else {
    console.log(`ok ${email}`);
  }
}
console.log(`\nDemo password for all users: ${DEMO_PASSWORD}`);
console.log("Next: apply supabase/seed_users.sql in the Supabase SQL editor.");
