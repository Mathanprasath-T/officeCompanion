import React from 'react';
import { AlertTriangle, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PriorityLevel } from '../../types';

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const normalized = (priority || 'medium').toLowerCase();

  const config = {
    urgent: {
      label: 'Urgent',
      className: 'bg-red-50 text-red-700 border-red-200/80',
      icon: AlertCircle,
    },
    high: {
      label: 'High Priority',
      className: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: AlertTriangle,
    },
    medium: {
      label: 'Medium',
      className: 'bg-blue-50 text-blue-700 border-blue-200/80',
      icon: ArrowUpRight,
    },
    low: {
      label: 'Low',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: ArrowDownRight,
    },
  }[normalized] || {
    label: normalized,
    className: 'bg-cream-200 text-ink-700 border-cream-300',
    icon: ArrowUpRight,
  };

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-sm ${config.className} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
