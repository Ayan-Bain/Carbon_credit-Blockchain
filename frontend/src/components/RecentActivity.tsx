'use client';

import { colors } from '@/lib/design-tokens';

interface Activity {
  id: string;
  type: 'PURCHASE' | 'RETIRED';
  projectName: string;
  date: string;
  amount: number;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    return type === 'PURCHASE' ? '📦' : '♻️';
  };

  const getActivityColor = (type: string) => {
    return type === 'PURCHASE'
      ? colors.primary.dark
      : colors.borders.light;
  };

  return (
    <div className="rounded-lg bg-white p-8 shadow-lg">
      {/* Header */}
      <h3
        className="text-lg font-extrabold mb-6"
        style={{ color: colors.primary.darkest }}
      >
        Recent Activity
      </h3>

      {/* Timeline */}
      <div className="space-y-6 relative">
        {/* Vertical line */}
        <div
          className="absolute left-3 top-6 bottom-0 w-0.5"
          style={{ backgroundColor: colors.borders.light }}
        />

        {/* Activity Items */}
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4 relative z-10">
            {/* Icon */}
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm"
              style={{ backgroundColor: getActivityColor(activity.type) }}
            >
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-1">
              <p
                className="font-semibold"
                style={{ color: colors.primary.darkest }}
              >
                {activity.type === 'PURCHASE' ? '📥' : '📤'} {activity.type === 'PURCHASE' ? 'Purchase' : 'Retired'}
                {': '}
                {activity.projectName}
              </p>
              <p style={{ color: colors.text.medium }} className="text-sm">
                {activity.date} • {activity.amount.toLocaleString()} tCO2e
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8" style={{ color: colors.text.medium }}>
          <p>No recent activity</p>
        </div>
      )}
    </div>
  );
}
