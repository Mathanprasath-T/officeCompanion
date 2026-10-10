import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Clock, Calendar, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { PriorityRecommendation } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface WhatToDoNowCardProps {
  recommendation: PriorityRecommendation | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const WhatToDoNowCard: React.FC<WhatToDoNowCardProps> = ({
  recommendation,
  isLoading,
  onRefresh,
}) => {
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleStartTask = async () => {
    if (!recommendation?.task) return;
    try {
      setStarting(true);
      const taskId = recommendation.task._id || recommendation.task.id;
      const res = await api.context.start(taskId!);
      if (res.success) {
        showToast(`Work session started for "${recommendation.task.title}"`, 'success');
        navigate('/context');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to start work session.', 'error');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-cream-300 shadow-soft animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/3 mb-4" />
        <div className="h-10 bg-cream-100 rounded mb-4" />
        <div className="h-20 bg-cream-50 rounded" />
      </div>
    );
  }

  if (!recommendation || !recommendation.task) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-cream-300 shadow-soft">
        <div className="flex items-center gap-2 text-brand-600 mb-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">What should I do now?</h2>
        </div>
        <div className="py-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-base text-slate-900">You're all caught up!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No pending high-priority tasks right now. Create a new task or review upcoming follow-ups.
          </p>
          <button
            onClick={() => navigate('/tasks')}
            className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Create or View Tasks
          </button>
        </div>
      </div>
    );
  }

  const { task, priority, reason, estimatedEffort } = recommendation;
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const deadlineStr = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'No deadline';

  return (
    <div className="bg-gradient-to-br from-white via-white to-brand-50/40 rounded-2xl p-6 border border-brand-200 shadow-soft relative overflow-hidden">
      {/* Decorative subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-200/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-700">
              What should I do first?
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">AI Priority Engine Recommendation</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-xs flex items-center gap-1 font-medium"
          title="Re-evaluate with AI"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Re-evaluate</span>
        </button>
      </div>

      {/* Task Content Box */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PriorityBadge priority={priority || task.priority} />
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {deadlineStr}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {estimatedEffort || task.estimatedTime || '45 mins'}
            </span>
          </div>
        </div>

        <div>
          <h3
            onClick={() => navigate(`/tasks/${task._id || task.id}`)}
            className="text-base sm:text-lg font-bold text-slate-900 hover:text-brand-600 cursor-pointer transition-colors"
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* AI Explanation Banner */}
        <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wide block">
              Why this task?
            </span>
            <p className="text-xs text-slate-800 mt-0.5 leading-relaxed font-medium">
              {reason || task.priorityReason || 'High urgency and impact.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={() => navigate(`/tasks/${task._id || task.id}`)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <span>View task details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleStartTask}
            disabled={starting}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 flex items-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{starting ? 'Starting Work Session...' : 'Start Task'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
