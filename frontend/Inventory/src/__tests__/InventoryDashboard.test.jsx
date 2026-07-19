import React from 'react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, waitForElementToBeRemoved } from '@testing-library/react'

import App from '../App'
import * as inventoryApi from '../services/inventoryApi'

const mockInventory = [
  { id: 'I-001', name: 'Coffee Beans', category: 'Beverage', inStock: 25, status: 'Good' },
  { id: 'I-002', name: 'Milk', category: 'Dairy', inStock: 5, status: 'Low' },
]

vi.mock('../services/inventoryApi', () => ({
  fetchInventory: vi.fn(),
  updateInventory: vi.fn(),
}))

describe('Inventory Dashboard (Ob2W1D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    inventoryApi.fetchInventory.mockResolvedValue(mockInventory)
  })

  test('renders sidebar with navigation links', () => {
    render(<App />)
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    const navWithin = within(nav)
    expect(navWithin.getByRole('link', { name: /Inventory/i })).toBeInTheDocument()
    expect(navWithin.getByRole('link', { name: /Orders/i })).toBeInTheDocument()
    expect(navWithin.getByRole('link', { name: /Reports/i })).toBeInTheDocument()
    expect(navWithin.getByRole('link', { name: /Settings/i })).toBeInTheDocument()
  })

  test('renders inventory table with correct headers', async () => {
    render(<App />)
    await waitForElementToBeRemoved(() => screen.queryByTestId('inventory-loading'))
    const table = screen.getByRole('table', { name: /inventory-table/i })
    expect(table).toBeInTheDocument()
    expect(screen.getByText('ITEM ID')).toBeInTheDocument()
    expect(screen.getByText('NAME')).toBeInTheDocument()
    expect(screen.getByText('CATEGORY')).toBeInTheDocument()
    expect(screen.getByText('IN STOCK')).toBeInTheDocument()
    expect(screen.getByText('STATUS')).toBeInTheDocument()
  })

  test('page layout has sidebar and main', () => {
    render(<App />)
    expect(screen.getByLabelText('sidebar')).toBeInTheDocument()
    expect(screen.getByRole('main') || screen.getByText(/Inventory Dashboard/i)).toBeTruthy()
  })
})