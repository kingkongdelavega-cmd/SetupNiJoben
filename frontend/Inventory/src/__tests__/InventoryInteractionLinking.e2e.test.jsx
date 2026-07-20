import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import * as inventoryApi from '../services/inventoryApi'

vi.mock('../services/inventoryApi', () => {
  return {
    fetchInventory: vi.fn(),
    updateInventory: vi.fn(),
  }
})

const mockInventoryBefore = [
  { id: 'I-002', name: 'Milk', category: 'Dairy', inStock: 6, status: 'NearingExpiration' },
]

const mockInventoryAfter = [
  { id: 'I-002', name: 'Milk', category: 'Dairy', inStock: 5, status: 'Low' },
]

describe('Inventory Management UI/API Synchronization (OB2W6D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    inventoryApi.fetchInventory.mockResolvedValueOnce(mockInventoryBefore)
    inventoryApi.fetchInventory.mockResolvedValueOnce(mockInventoryAfter)

    inventoryApi.updateInventory.mockResolvedValueOnce({
      id: 'I-002',
      inStock: 5,
      status: 'Low',
    })
  })

  it('reflects inventory status change after successful adjustment (sync check)', async () => {
    const user = userEvent.setup()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Milk/i)).toBeInTheDocument()
    })

    // Open edit modal
    const editBtn = screen.getByTestId('edit-btn-I-002')
    await user.click(editBtn)

    // Fill form
    const qtyInput = screen.getByLabelText(/Adjustment Quantity/i)
    await user.clear(qtyInput)
    await user.type(qtyInput, '1')

    // Select reason (required by form validation)
    const reasonSelect = screen.getByLabelText(/Adjustment Reason/i)
    await user.selectOptions(reasonSelect, 'Restock')

    const submitBtn = screen.getByTestId('form-submit-btn')
    await user.click(submitBtn)

    // After update, UI should re-fetch and show Low status
    await waitFor(() => {
      expect(inventoryApi.updateInventory).toHaveBeenCalled()
      expect(screen.getAllByText(/Low/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByTestId('stock-badge-Low')).toBeInTheDocument()
    })
  })
})

