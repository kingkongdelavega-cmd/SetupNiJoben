import { describe, test, expect, vi, afterEach } from 'vitest'

import stockDeductionService from '../../src/services/stockDeductionService'
import { inventory } from '../../src/services/inventoryStore'

const { deductStockForSale } = stockDeductionService

// Chainable query-builder mock supporting .select()/.update()/.eq()/.single()
// in any combination, matching how the real Supabase client chains calls.
function createQueryBuilderMock({ data, error }) {
  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data, error })),
    then: (resolve) => resolve({ data, error }),
  }
  return builder
}

describe('stockDeductionService (supabase mocked)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('throws 409 when deduction would go below zero (supabase mode)', async () => {
    const item = inventory.find((i) => i.id === 'I-002')
    const current = item.inStock

    const selectBuilder = createQueryBuilderMock({
      data: { id: 'I-002', item_name: 'Milk', current_stock: current },
      error: null,
    })
    const updateBuilder = createQueryBuilderMock({ data: null, error: null })

    const inventorySupabaseStore = require('../../src/services/inventorySupabaseStore')
    if (typeof inventorySupabaseStore.__setSupabaseClient === 'function') {
      inventorySupabaseStore.__setSupabaseClient(() => ({
        from: () => selectBuilder,
      }))
    }

    const supabaseClient = require('../../src/services/supabaseClient')
    vi.spyOn(supabaseClient, 'getSupabase').mockImplementation(() => ({
      from: () => updateBuilder,
    }))

    await expect(
      deductStockForSale({
        itemId: 'I-002',
        quantity: current + 1,
        reason: 'POS_SALE',
        mode: 'supabase',
      })
    ).rejects.toMatchObject({ statusCode: 409 })
  })
})