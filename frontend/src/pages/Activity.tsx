import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Compass,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { Activity } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const { showToast } = useToast();

  const loadActivities = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.activity.getAll({
        limit: 100,
        type: filterType === 'all' ? undefined : filterType,
      });
      if (res.success) {
        setActivities(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load activity stream', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterType, showToast]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (type: string) => {
    if (type.includes('task_completed') || type.includes('followup_completed')) {
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      };
    }
    if (type.includes('context')) {
      return {
        icon: Compass,
        bg: 'bg-amber-100 text-amber-600 border-amber-200',
      };
    }
    if (type.includes('ai') || type.includes('prioritize')) {
      return {
        icon: Sparkles,
        bg: 'bg-brand-100 text-brand-600 border-brand-200',
      };
    }
    if (type.includes('followup')) {
      return {
        icon: Clock,
        bg: 'bg-blue-100 text-blue-600 border-blue-200',
      };
    }
    return {
      icon: ActivityIcon,
      bg: 'bg-cream-200 text-ink-600 border-cream-300',
    };
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ActivityIcon className="w-7 h-7 text-brand-400" />
            Activity & Audit Stream
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Complete timeline of actions, AI prioritizations, context captures, and workflow updates.
          </p>
        </div>
        <button
          onClick={loadActivities}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-cream-50 border border-cream-300 rounded-xl text-xs font-semibold text-ink-700 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-soft flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-2 pr-1 flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'task_created', label: 'Tasks Created' },
          { id: 'task_completed', label: 'Tasks Completed' },
          { id: 'context_saved', label: 'Context Sessions' },
          { id: 'followup_created', label: 'Follow-ups' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      {isLoading ? (
        <LoadingSpinner message="Loading activity audit trail..." />
      ) : activities.length === 0 ? (
        <EmptyState
          title="No activities found"
          description="Your activity stream is currently empty for this filter."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-cream-300 shadow-card p-6 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-cream-200 hidden sm:block"></div>

          <div className="space-y-6">
            {activities.map((act) => {
              const { icon: Icon, bg } = getActivityIcon(act.type);
              const formattedTime = formatTimestamp(act.timestamp || act.createdAt || new Date().toISOString());

              return (
                <div key={act._id} className="relative flex items-start gap-4 group">
                  {/* Icon Node */}
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-105 shadow-sm ${bg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 bg-cream-50/50 group-hover:bg-cream-50 rounded-2xl p-4 border border-cream-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-ink-900 leading-snug">
                        {act.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-ink-500">
                        <span className="font-mono">{formattedTime}</span>
                        <span>•</span>
                        <span className="capitalize font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                          {act.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {act.taskId && (
                      <Link
                        to={typeof act.taskId === 'object' ? `/tasks/${act.taskId._id}` : `/tasks/${act.taskId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl self-start sm:self-center transition-colors shrink-0"
                      >
                        <span>View Task</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
