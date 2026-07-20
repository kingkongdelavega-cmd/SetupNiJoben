// Supabase client abstraction.
//
// When SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) are set,
// this returns a REAL @supabase/supabase-js client so the app can talk to an
// actual Supabase database.
//
// When those env vars are absent, it falls back to a placeholder that
// throws on use, so misconfiguration is loud instead of silently masked.
//
// Tests should NOT rely on the throw-fallback as their "database". Inject a
// deterministic fake client instead via:
//   require('./inventorySupabaseStore').__setSupabaseClient(() => fakeClient)
// (see tests/helpers/fakeSupabaseClient.js)

let cachedClient = null

function createSupabasePlaceholder() {
  return {
    from() {
      throw new Error(
        'Supabase client not configured. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY), or mock this module in tests.'
      )
    },
  }
}

function buildRealClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

  if (!url || !key) {
    return null
  }

  let createClient
  try {
    // Lazy require so environments without the package installed (or
    // without Supabase configured) never even attempt to load it.
    ;({ createClient } = require('@supabase/supabase-js'))
  } catch (err) {
    console.error(
      '[supabaseClient] SUPABASE_URL/SUPABASE_KEY are set but "@supabase/supabase-js" is not installed. ' +
        'Run `npm install @supabase/supabase-js` in backend/. Falling back to placeholder client.'
    )
    return null
  }

  return createClient(url, key)
}

/**
 * Returns a Supabase-like client.
 * - Real client when SUPABASE_URL + SUPABASE_KEY are configured and the
 *   @supabase/supabase-js package is installed.
 * - Placeholder (throws on use) otherwise.
 */
function getSupabase() {
  if (cachedClient) return cachedClient
  const real = buildRealClient()
  cachedClient = real || createSupabasePlaceholder()
  return cachedClient
}

/**
 * Test/dev-only helper: clears the cached client so a freshly injected
 * fake client, or a newly-set env var, takes effect.
 */
function __resetSupabaseClientCache() {
  cachedClient = null
}

module.exports = {
  getSupabase,
  __resetSupabaseClientCache,
}