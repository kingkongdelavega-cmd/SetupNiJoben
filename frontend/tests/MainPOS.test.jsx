import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MainPOS from '../src/pages/MainPOS'

describe('MainPOS', () => {
  const mockUser = { username: 'testuser', email: 'test@example.com' }
  const mockOnLogout = vi.fn()

  it('should render main POS layout', () => {
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByText('Point-of-Sale')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('product-page')).toBeInTheDocument()
    expect(screen.getByTestId('order-summary')).toBeInTheDocument()
  })

  it('should display customer recording button', () => {
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByTestId('customer-recording-button')).toBeInTheDocument()
  })

  it('should add product to cart when add to cart button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const addButton = screen.getByTestId('add-to-cart-1')
    await user.click(addButton)

    expect(screen.getByTestId('cart-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('total-items')).toHaveTextContent('1')
  })

  it('should update total items when multiple products are added', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const addButton1 = screen.getByTestId('add-to-cart-1')
    const addButton3 = screen.getByTestId('add-to-cart-3')

    await user.click(addButton1)
    await user.click(addButton3)

    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
  })

  it('should increment quantity when same product is added twice', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const addButton = screen.getByTestId('add-to-cart-1')
    await user.click(addButton)
    await user.click(addButton)

    expect(screen.getByTestId('qty-1')).toHaveTextContent('2')
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
  })

  it('should remove item from cart', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const addButton = screen.getByTestId('add-to-cart-1')
    await user.click(addButton)

    expect(screen.getByTestId('cart-item-1')).toBeInTheDocument()

    const removeButton = screen.getByTestId('remove-1')
    await user.click(removeButton)

    expect(screen.queryByTestId('cart-item-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('empty-cart')).toBeInTheDocument()
  })

  it('should clear entire cart', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const addButton1 = screen.getByTestId('add-to-cart-1')
    const addButton3 = screen.getByTestId('add-to-cart-3')

    await user.click(addButton1)
    await user.click(addButton3)

    const clearButton = screen.getByTestId('clear-cart-btn')
    await user.click(clearButton)

    expect(screen.getByTestId('empty-cart')).toBeInTheDocument()
  })

  it('should navigate between menu items', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const inventoryMenu = screen.getByTestId('menu-inventory')
    await user.click(inventoryMenu)

    expect(screen.getByText('Inventory Module')).toBeInTheDocument()
  })

  it('should display POS content when POS menu is selected', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const inventoryMenu = screen.getByTestId('menu-inventory')
    await user.click(inventoryMenu)

    expect(screen.queryByTestId('product-page')).not.toBeInTheDocument()

    const posMenu = screen.getByTestId('menu-pos')
    await user.click(posMenu)

    expect(screen.getByTestId('product-page')).toBeInTheDocument()
  })

  it('should call onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByTestId('logout-button')
    await user.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('should display customer count in order summary', () => {
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    expect(screen.getByTestId('customer-count')).toHaveTextContent('1')
  })

  it('should update customer count in order summary when confirmed in CustomerRecordingButton', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    // Verify initial customer count is 1
    expect(screen.getByTestId('customer-count')).toHaveTextContent('1')

    // Click the customer recording button
    const customerButton = screen.getByTestId('customer-recording-button')
    await user.click(customerButton)

    // Change the customer count to 5
    const customerInput = screen.getByTestId('customer-input')
    await user.clear(customerInput)
    await user.type(customerInput, '5')

    // Click confirm button
    const confirmButton = screen.getByTestId('modal-confirm')
    await user.click(confirmButton)

    // Verify customer count is updated to 5 in OrderSummary
    expect(screen.getByTestId('customer-count')).toHaveTextContent('5')
  })

  it('should reset customer count to 1 when cancel is clicked in CustomerRecordingButton', async () => {
    const user = userEvent.setup()
    render(<MainPOS user={mockUser} onLogout={mockOnLogout} />)

    // Set customer count to 3 first
    const customerButton = screen.getByTestId('customer-recording-button')
    await user.click(customerButton)

    const customerInput = screen.getByTestId('customer-input')
    await user.clear(customerInput)
    await user.type(customerInput, '3')

    const confirmButton = screen.getByTestId('modal-confirm')
    await user.click(confirmButton)

    // Verify customer count is 3
    expect(screen.getByTestId('customer-count')).toHaveTextContent('3')

    // Click customer button again and cancel
    await user.click(customerButton)

    const cancelButton = screen.getByTestId('modal-cancel')
    await user.click(cancelButton)

    // Verify customer count is reset to 1
    expect(screen.getByTestId('customer-count')).toHaveTextContent('1')
  })
})
