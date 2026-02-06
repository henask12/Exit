import React from 'react';
import AlertCard from '../../components/AlertCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function RecentAlerts() {
  return (
    <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Alerts</h3>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          View All
        </Button>
      </div>
      <div className="space-y-4">
        <AlertCard
          type="warning"
          code="ET 302"
          time="2 min ago"
          message="Passenger count mismatch detected - 2 passengers pending verification"
          showResolve={true}
        />
        <AlertCard
          type="success"
          code="ET 608"
          time="15 min ago"
          message="All passengers verified successfully for intermediate disembarkation"
        />
        <AlertCard
          type="error"
          code="ET 500"
          time="23 min ago"
          message="Sabre PSS connection latency detected - 8 seconds response time"
          showResolve={true}
        />
      </div>
    </Card>
  );
}
