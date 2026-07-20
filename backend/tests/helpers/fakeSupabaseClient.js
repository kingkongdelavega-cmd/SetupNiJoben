// Deterministic fake Supabase client for integration/E2E tests.
//
// Wire it in at the top of a test file with:
//
//   const { makeFakeSupabaseClient } = require('../helpers/fakeSupabaseClient')
//   const inventorySupabaseStore = require('../../src/services/inventorySupabaseStore')
//
//   let seedRows
//   beforeEach(() => {
//     seedRows = [
//       { id: 'I-001', item_name: 'Milk Tea Powder', current_stock: 20, inventory_categories: { name: 'Beverage' } },
//       { id: 'I-002', item_name: 'Cups (16oz)', current_stock: 3,  inventory_categories: { name: 'Supplies' } },
//     ]
//     inventorySupabaseStore.__setSupabaseClient(() => makeFakeSupabaseClient(seedRows))
//   })
//
// This makes E2E tests exercise the REAL Supabase-facing code path
// (query filtering, row mapping in inventoryService.mapInventoryRow, error
// propagation) instead of silently falling through to the unrelated
// in-memory fixture data in inventoryStore.js. It's a test double for the
// network call, not a replacement for a real staging-Supabase smoke test —
// pair this with an occasional manual/staging run against a real project
// when SUPABASE_URL/SUPABASE_KEY are set (see supabaseClient.js).

function makeFakeSupabaseClient(initialRows = []) {
  let rows = initialRows.map((r) => ({ ...r }))

  function from(name) {
    if (name !== 'inventory') {
      throw new Error(`fakeSupabaseClient: unexpected table "${name}"`)
    }

    const filters = []
    let pendingInsert = null
    let pendingUpdate = null
    let pendingDelete = false

    function matches(row) {
      return filters.every((fn) => fn(row))
    }

    function resolveMany() {
      if (pendingDelete) {
        rows = rows.filter((r) => !matches(r))
        return { data: null, error: null }
      }
      if (pendingUpdate) {
        rows = rows.map((r) => (matches(r) ? { ...r, ...pendingUpdate } : r))
        return { data: rows.filter(matches), error: null }
      }
      return { data: rows.filter(matches), error: null }
    }

    const builder = {
      select() {
        return builder
      },
      eq(column, value) {
        filters.push((row) => row[column] === value)
        return builder
      },
      insert(row) {
        pendingInsert = { id: row.id || `I-${String(rows.length + 1).padStart(3, '0')}`, ...row }
        rows.push(pendingInsert)
        return builder
      },
      update(changes) {
        pendingUpdate = changes
        return builder
      },
      delete() {
        pendingDelete = true
        return builder
      },
      single() {
        if (pendingInsert) {
          return Promise.resolve({ data: pendingInsert, error: null })
        }
        const { data, error } = resolveMany()
        if (error) return Promise.resolve({ data: null, error })
        const row = Array.isArray(data) ? data[0] : data
        if (!row) {
          return Promise.resolve({
            data: null,
            error: { message: 'Row not found', statusCode: 404 },
          })
        }
        return Promise.resolve({ data: row, error: null })
      },
      // Supports `await supabase.from('inventory').select('*')` with no .single()
      then(onFulfilled, onRejected) {
        return Promise.resolve(resolveMany()).then(onFulfilled, onRejected)
      },
    }

    return builder
  }

  return { from }
}

module.exports = { makeFakeSupabaseClient }