import React from 'react';
import PropTypes from 'prop-types';

const ADJUSTMENT_REASONS = [
  { value: 'Restock', label: 'Restock' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'InventoryCount', label: 'Inventory Count' },
  { value: 'Expiration', label: 'Expiration' },
  { value: 'Theft', label: 'Theft' },
];

export default function AdjustmentReasonDropdown({ value, onChange, label = 'Adjustment Reason' }) {
  return (
    <div className="reason-dropdown-group" data-testid="reason-dropdown-group">
      <label htmlFor="reason-select" className="reason-label">
        {label}
      </label>
      <select
        id="reason-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="reason-select"
        data-testid="reason-select"
        aria-label="Select adjustment reason"
      >
        <option value="">-- Select a reason --</option>
        {ADJUSTMENT_REASONS.map((reason) => (
          <option key={reason.value} value={reason.value}>
            {reason.label}
          </option>
        ))}
      </select>
    </div>
  );
}

AdjustmentReasonDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export { ADJUSTMENT_REASONS };
