import React from 'react';
import PropTypes from 'prop-types';
import AlertItem from './AlertItem';

export default function AlertList({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="alert-empty-state" data-testid="alert-empty-state">
        <p>No inventory alerts at this time</p>
      </div>
    );
  }

  // Sort alerts: critical first, then by timestamp (newest first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (a.severity !== 'critical' && b.severity === 'critical') return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div className="alert-list" role="list" data-testid="alert-list">
      {sortedAlerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
}

AlertList.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      itemId: PropTypes.string.isRequired,
      itemName: PropTypes.string.isRequired,
      currentStock: PropTypes.number.isRequired,
      threshold: PropTypes.number.isRequired,
      severity: PropTypes.oneOf(['critical', 'warning']).isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.instanceOf(Date).isRequired,
    })
  ).isRequired,
};
