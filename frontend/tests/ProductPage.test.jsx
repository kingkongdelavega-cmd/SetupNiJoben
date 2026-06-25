import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductPage from '../src/components/ProductPage'

describe('ProductPage', () => {
  let mockOnAddToCart

  beforeEach(() => {
    mockOnAddToCart = vi.fn()
  })

  it('should render product page with title', () => {
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByTestId('product-page')).toBeInTheDocument()
  })

  it('should display products grid', () => {
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    expect(screen.getByTestId('products-grid')).toBeInTheDocument()
  })

  it('should display all products with name and price', () => {
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    expect(screen.getByTestId('product-name-1')).toHaveTextContent('Iced Americano')
    expect(screen.getByTestId('product-price-1')).toHaveTextContent('150')

    expect(screen.getByTestId('product-name-3')).toHaveTextContent('Chocolate Cake')
    expect(screen.getByTestId('product-price-3')).toHaveTextContent('220')
  })

  it('should have add to cart button for each product', () => {
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    expect(screen.getByTestId('add-to-cart-1')).toBeInTheDocument()
    expect(screen.getByTestId('add-to-cart-3')).toBeInTheDocument()
    expect(screen.getByTestId('add-to-cart-8')).toBeInTheDocument()
  })

  it('should call onAddToCart when add to cart button is clicked', async () => {
    const user = userEvent.setup()
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    const addButton = screen.getByTestId('add-to-cart-1')
    await user.click(addButton)

    expect(mockOnAddToCart).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'Iced Americano',
        price: 150
      })
    )
  })

  it('should call onAddToCart multiple times when different products are clicked', async () => {
    const user = userEvent.setup()
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    const addButton1 = screen.getByTestId('add-to-cart-1')
    const addButton3 = screen.getByTestId('add-to-cart-3')

    await user.click(addButton1)
    await user.click(addButton3)

    expect(mockOnAddToCart).toHaveBeenCalledTimes(2)
  })

  it('should display product emoji/image', () => {
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    const products = screen.getAllByTestId(/product-\d+/)
    expect(products.length).toBeGreaterThan(0)
  })

  it('should display product category', () => {
    render(<ProductPage onAddToCart={mockOnAddToCart} />)

    const productCards = screen.getAllByTestId(/product-\d+/)
    const firstCard = productCards[0]

    expect(firstCard).toHaveTextContent('Beverages')
  })
})
