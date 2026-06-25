import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderSummary from '../src/components/OrderSummary'

describe('OrderSummary', () => {
  const mockOnRemoveItem = vi.fn()
  const mockOnUpdateQuantity = vi.fn()
  const mockOnClearCart = vi.fn()
  const mockOnCheckout = vi.fn()

  const mockCart = [
    { id: '1', name: 'Iced Americano', price: 150, image: '☕', quantity: 2 },
    { id: '3', name: 'Chocolate Cake', price: 220, image: '🍰', quantity: 1 }
  ]

  it('should render order summary section', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('order-summary')).toBeInTheDocument()
    expect(screen.getByText('Order Summary')).toBeInTheDocument()
  })

  it('should display total items count', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('total-items')).toHaveTextContent('3')
  })

  it('should display customer count', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={2}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('customer-count')).toHaveTextContent('2')
  })

  it('should display cart items', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('cart-item-1')).toBeInTheDocument()
    expect(screen.getByTestId('cart-item-3')).toBeInTheDocument()
  })

  it('should display item names, prices, and quantities', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByText('Iced Americano')).toBeInTheDocument()
    expect(screen.getByTestId('qty-1')).toHaveTextContent('2')
    expect(screen.getByTestId('qty-3')).toHaveTextContent('1')
  })

  it('should display empty cart message when cart is empty', () => {
    render(
      <OrderSummary
        cart={[]}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('empty-cart')).toHaveTextContent('Cart is empty')
  })

  it('should display totals', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('subtotal')).toHaveTextContent('520')
    expect(screen.getByTestId('grand-total')).toHaveTextContent('520')
  })

  it('should calculate and display per customer price', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={2}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('per-customer')).toHaveTextContent('260')
  })

  it('should call onRemoveItem when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    const removeButton = screen.getByTestId('remove-1')
    await user.click(removeButton)

    expect(mockOnRemoveItem).toHaveBeenCalledWith('1')
  })

  it('should call onUpdateQuantity when quantity increase button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    const increaseButton = screen.getByTestId('increase-qty-1')
    await user.click(increaseButton)

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 3)
  })

  it('should call onUpdateQuantity when quantity decrease button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    const decreaseButton = screen.getByTestId('decrease-qty-1')
    await user.click(decreaseButton)

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 1)
  })

  it('should call onClearCart when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    const clearButton = screen.getByTestId('clear-cart-btn')
    await user.click(clearButton)

    expect(mockOnClearCart).toHaveBeenCalled()
  })

  it('should disable clear and checkout buttons when cart is empty', () => {
    render(
      <OrderSummary
        cart={[]}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    expect(screen.getByTestId('clear-cart-btn')).toBeDisabled()
    expect(screen.getByTestId('checkout-btn')).toBeDisabled()
  })

  it('should call onCheckout when checkout button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
        onCheckout={mockOnCheckout}
      />
    )

    const checkoutButton = screen.getByTestId('checkout-btn')
    await user.click(checkoutButton)

    expect(mockOnCheckout).toHaveBeenCalled()
  })

  it('should display item subtotals correctly', () => {
    render(
      <OrderSummary
        cart={mockCart}
        customerCount={1}
        onRemoveItem={mockOnRemoveItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onClearCart={mockOnClearCart}
      />
    )

    expect(screen.getByTestId('subtotal-1')).toHaveTextContent('300')
    expect(screen.getByTestId('subtotal-3')).toHaveTextContent('220')
  })
})
