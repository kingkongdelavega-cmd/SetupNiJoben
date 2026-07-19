import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryTable from '../components/InventoryTable';
import * as inventoryApi from '../services/inventoryApi';

const mockInventory = [
  { id: 'I-001', name: 'Coffee Beans', category: 'Beverage', inStock: 25, status: 'Good' },
  { id: 'I-002', name: 'Milk', category: 'Dairy', inStock: 5, status: 'Low' },
  { id: 'I-003', name: 'Yogurt', category: 'Dairy', inStock: 8, status: 'NearingExpiration' },
  { id: 'I-004', name: 'Croissant', category: 'Pastry', inStock: 20, status: 'Good' },
  { id: 'I-005', name: 'Cookies', category: 'Snacks', inStock: 3, status: 'Low' },
];

vi.mock('../services/inventoryApi', () => ({
  fetchInventory: vi.fn(),
  updateInventory: vi.fn(),
}));

async function renderLoaded() {
  render(<InventoryTable />);
  await waitForElementToBeRemoved(() => screen.queryByTestId('inventory-loading'));
}

describe('InventoryTable Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inventoryApi.fetchInventory.mockResolvedValue(mockInventory);
  });

  it('renders the inventory table with all items', async () => {
    await renderLoaded();
    const table = screen.getByRole('table', { name: 'inventory-table' });
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Coffee Beans')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('displays search input field', async () => {
    await renderLoaded();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('displays filter dropdown', async () => {
    await renderLoaded();
    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument();
  });

  it('shows stock status badges for all items', async () => {
    await renderLoaded();
    expect(screen.getAllByTestId('stock-badge-Good').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('stock-badge-Low').length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('stock-badge-NearingExpiration').length).toBeGreaterThan(0);
  });

  it('displays edit button for each item', async () => {
    await renderLoaded();
    expect(screen.getByTestId('edit-btn-I-001')).toBeInTheDocument();
    expect(screen.getByTestId('edit-btn-I-002')).toBeInTheDocument();
    expect(screen.getByTestId('edit-btn-I-003')).toBeInTheDocument();
    expect(screen.getByTestId('edit-btn-I-004')).toBeInTheDocument();
    expect(screen.getByTestId('edit-btn-I-005')).toBeInTheDocument();
  });

  it('opens adjustment modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByTestId('edit-btn-I-001'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Adjust Inventory')).toBeInTheDocument();
  });

  it('displays correct item in modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByTestId('edit-btn-I-002'));
    expect(screen.getByTestId('item-name-display')).toHaveTextContent('Milk');
    expect(screen.getByTestId('current-stock-display')).toHaveTextContent('5 units');
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByTestId('edit-btn-I-001'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();

    await user.click(screen.getByTestId('form-cancel-btn'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('filters items by search term', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.type(screen.getByTestId('search-input'), 'Coffee');
    expect(screen.getByText('Coffee Beans')).toBeInTheDocument();
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
  });

  it('filters items by category', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.selectOptions(screen.getByTestId('filter-dropdown'), 'Dairy');
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Yogurt')).toBeInTheDocument();
    expect(screen.queryByText('Coffee Beans')).not.toBeInTheDocument();
  });

  it('combines search and filter', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.selectOptions(screen.getByTestId('filter-dropdown'), 'Dairy');
    await user.type(screen.getByTestId('search-input'), 'Milk');
    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.queryByText('Yogurt')).not.toBeInTheDocument();
  });

  it('clears filter and shows all items', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const filterDropdown = screen.getByTestId('filter-dropdown');

    await user.selectOptions(filterDropdown, 'Beverage');
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();

    await user.selectOptions(filterDropdown, '');
    expect(screen.getByText('Coffee Beans')).toBeInTheDocument();
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });

  it('shows "No items found" when search yields no results', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.type(screen.getByTestId('search-input'), 'NonexistentItem');
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('displays correct stock status colors', async () => {
    await renderLoaded();
    const goodBadges = screen.getAllByTestId('stock-badge-Good');
    const lowBadges = screen.getAllByTestId('stock-badge-Low');
    const expiringBadges = screen.getAllByTestId('stock-badge-NearingExpiration');

    expect(goodBadges[0]).toHaveStyle({ backgroundColor: '#4CAF50' });
    expect(lowBadges[0]).toHaveStyle({ backgroundColor: '#FF0000' });
    expect(expiringBadges[0]).toHaveStyle({ backgroundColor: '#FFC107' });
  });

  it('has controls section with search and filter', async () => {
    await renderLoaded();
    const controlsSection = screen.getByTestId('controls-section');
    expect(controlsSection).toBeInTheDocument();
    expect(within(controlsSection).getByTestId('search-input')).toBeInTheDocument();
    expect(within(controlsSection).getByTestId('filter-dropdown')).toBeInTheDocument();
  });

  it('filters by item ID in search', async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.type(screen.getByTestId('search-input'), 'I-001');
    expect(screen.getByText('Coffee Beans')).toBeInTheDocument();
    expect(screen.queryByText('Milk')).not.toBeInTheDocument();
  });

  it('displays all categories in filter dropdown', async () => {
    await renderLoaded();
    const options = screen.getByTestId('filter-dropdown').querySelectorAll('option');
    const categories = Array.from(options).map((opt) => opt.textContent);

    expect(categories).toContain('Beverage');
    expect(categories).toContain('Dairy');
    expect(categories).toContain('Pastry');
    expect(categories).toContain('Snacks');
  });

  it('can edit multiple items sequentially', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.click(screen.getByTestId('edit-btn-I-001'));
    expect(screen.getByTestId('item-name-display')).toHaveTextContent('Coffee Beans');

    await user.click(screen.getByTestId('form-cancel-btn'));

    await user.click(screen.getByTestId('edit-btn-I-002'));
    expect(screen.getByTestId('item-name-display')).toHaveTextContent('Milk');
  });
});