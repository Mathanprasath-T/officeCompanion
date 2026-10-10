import React from 'react';
import { CheckCircle2, Clock, PlayCircle, AlertTriangle } from 'lucide-react';
import { TaskStatus, FollowUpStatus, WorkSessionStatus } from '../../types';

interface StatusBadgeProps {
  status: TaskStatus | FollowUpStatus | WorkSessionStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = (status || 'pending').toLowerCase();

  const config: Record<string, { label: string; className: string; icon: any }> = {
    pending: {
      label: 'Pending',
      className: 'bg-cream-200 text-ink-700 border-cream-300',
      icon: Clock,
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-brand-50 text-brand-700 border-brand-200',
      icon: PlayCircle,
    },
    active: {
      label: 'Active',
      className: 'bg-brand-50 text-brand-700 border-brand-200',
      icon: PlayCircle,
    },
    paused: {
      label: 'Paused',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    due: {
      label: 'Due Soon',
      className: 'bg-brand-50 text-brand-700 border-brand-200',
      icon: Clock,
    },
    overdue: {
      label: 'Overdue',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: AlertTriangle,
    },
    completed: {
      label: 'Completed',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
  };

  const current = config[normalized] || {
    label: normalized,
    className: 'bg-cream-200 text-ink-700 border-cream-300',
    icon: Clock,
  };

  const Icon = current.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border shadow-sm ${current.className} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{current.label}</span>
    </span>
  );
};
