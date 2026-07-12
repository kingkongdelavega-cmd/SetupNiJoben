const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Allow unit tests to run without Supabase env.
  // Routes/services that require Supabase should fail at call-time.
  module.exports = { supabase: null }
  return
}

// Use service role key for server-side privileges.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
})

module.exports = { supabase }


