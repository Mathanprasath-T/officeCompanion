import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Play, CheckCircle2, CircleDot, ArrowRight, Clock } from 'lucide-react';
import { WorkSession } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ContextRecoveryBannerProps {
  session: WorkSession | null;
  onSessionUpdated: () => void;
}

export const ContextRecoveryBanner: React.FC<ContextRecoveryBannerProps> = ({
  session,
  onSessionUpdated,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (!session) {
    return null;
  }

  const taskTitle = typeof session.taskId === 'object' ? session.taskId.title : 'Active Task';

  const timeAgo = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleResume = async () => {
    try {
      await api.context.resume(session._id);
      showToast(`Resumed session for "${taskTitle}"`, 'success');
      onSessionUpdated();
      navigate('/context');
    } catch (err: any) {
      showToast(err.message || 'Failed to resume session.', 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Where did I leave off?
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              AI Context Recovery & Checkpoints
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Last active {timeAgo(session.lastActiveAt)}</span>
        </div>
      </div>

      {/* Main card box */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
              Active Work Session
            </span>
            <h3 className="text-base font-bold text-slate-900">{taskTitle}</h3>
          </div>

          <button
            onClick={handleResume}
            className="self-start sm:self-auto px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Resume Work</span>
          </button>
        </div>

        {/* Checkpoint Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Completed Checkpoints */}
          <div className="space-y-2">
            <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block">
              Completed Actions ({session.completedActions?.length || 0})
            </span>
            <div className="space-y-1.5">
              {session.completedActions && session.completedActions.length > 0 ? (
                session.completedActions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-ink-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="line-through text-ink-500">{item}</span>
                  </div>
                ))
              ) : (
                <span className="text-ink-400 italic">No completed actions logged yet.</span>
              )}
            </div>
          </div>

          {/* Remaining Checkpoints */}
          <div className="space-y-2">
            <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block">
              Remaining Actions ({session.remainingActions?.length || 0})
            </span>
            <div className="space-y-1.5">
              {session.remainingActions && session.remainingActions.length > 0 ? (
                session.remainingActions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-ink-800 font-medium">
                    <CircleDot className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))
              ) : (
                <span className="text-ink-400 italic">Ready to complete final steps.</span>
              )}
            </div>
          </div>
        </div>

        {/* Next Action Callout */}
        {session.nextAction && (
          <div className="p-3 bg-white rounded-lg border border-cream-300 flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-bold text-ink-500 uppercase tracking-wider text-[10px] block">
                Recommended Next Step
              </span>
              <span className="font-bold text-brand-700">{session.nextAction}</span>
            </div>
            <button
              onClick={() => navigate('/context')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
            >
              <span>Open context board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
