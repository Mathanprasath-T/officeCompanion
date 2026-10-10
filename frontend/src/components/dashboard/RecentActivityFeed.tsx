import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity as ActivityIcon, CheckCircle2, Play, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { Activity } from '../../types';

interface RecentActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities, isLoading }) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
      case 'followup_completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'task_started':
      case 'context_resumed':
        return <Play className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />;
      case 'commitment_detected':
      case 'priority_updated':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-ink-500" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">Recent Activity</h2>
            <span className="text-[11px] text-slate-500 font-medium">Chronological live stream</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/activity')}
          className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No activity recorded yet. Your actions will be tracked automatically.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {activities.slice(0, 5).map((item) => (
            <div key={item._id} className="py-3 flex items-start gap-3 text-xs group">
              <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-medium leading-snug">{item.description}</p>
                <span className="text-[11px] text-slate-400 mt-0.5 block">{timeAgo(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
