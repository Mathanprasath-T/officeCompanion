import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Coffee,
  ArrowUp,
  ArrowDown,
  Trash2,
  Play,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { DailyPlanResponse, PlanItem, PriorityLevel, Task } from '../types';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const DailyPlanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [planData, setPlanData] = useState<DailyPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string>('');
  const [isReordering, setIsReordering] = useState(false);

  // Modals
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const loadPlan = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const res = await api.planner.getToday();
      if (res.success && res.data) {
        setPlanData(res.data);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load today's plan.", 'error');
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      setGeneratingStep('Analyzing tasks...');
      await new Promise((r) => setTimeout(r, 300));
      setGeneratingStep('Checking deadlines...');
      await new Promise((r) => setTimeout(r, 300));
      setGeneratingStep('Building your plan...');

      const res = await api.planner.generate();
      if (res.success && res.data) {
        setPlanData(res.data);
        showToast('Daily plan recalculated based on active priorities & deadlines.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate plan.', 'error');
    } finally {
      setIsRegenerating(false);
      setGeneratingStep('');
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!planData || !planData.planItems) return;

    // Filter only task items for reordering sequence
    const taskItems = planData.planItems.filter((item) => item.type === 'task' && item.taskId);
    const targetItem = planData.planItems[index];
    if (!targetItem || targetItem.type !== 'task' || !targetItem.taskId) return;

    const currentTaskIndex = taskItems.findIndex((t) => String(t.taskId) === String(targetItem.taskId));
    if (currentTaskIndex === -1) return;

    const newIndex = direction === 'up' ? currentTaskIndex - 1 : currentTaskIndex + 1;
    if (newIndex < 0 || newIndex >= taskItems.length) return;

    const reorderedTaskItems = [...taskItems];
    const [moved] = reorderedTaskItems.splice(currentTaskIndex, 1);
    reorderedTaskItems.splice(newIndex, 0, moved);

    const orderedTaskIds = reorderedTaskItems.map((item) => String(item.taskId));

    try {
      setIsReordering(true);
      const res = await api.planner.reorder(orderedTaskIds);
      if (res.success && res.data) {
        setPlanData(res.data);
        showToast('Schedule reordered.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update order.', 'error');
    } finally {
      setIsReordering(false);
    }
  };

  const handleRemoveFromPlan = async (taskId: string) => {
    try {
      const res = await api.planner.toggleTask(taskId, false);
      if (res.success && res.data) {
        setPlanData(res.data);
        showToast("Task removed from today's plan.", 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to remove task.', 'error');
    }
  };

  const handleIncludeTask = async (taskId: string) => {
    try {
      const res = await api.planner.toggleTask(taskId, true);
      if (res.success && res.data) {
        setPlanData(res.data);
        setIsAddTaskModalOpen(false);
        showToast("Task added to today's plan.", 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add task.', 'error');
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await api.context.start(taskId);
      navigate('/context');
    } catch (err: any) {
      navigate(`/tasks/${taskId}`);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      await api.tasks.complete(taskId);
      showToast('Task marked as completed.', 'success');
      loadPlan(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete task.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <LoadingSpinner size="lg" message="Building your daily plan..." />
      </div>
    );
  }

  const taskItems = planData?.planItems.filter((i) => i.type === 'task') || [];
  const metrics = planData?.metrics;
  const progress = planData?.progress;

  const handleExportPlanCsv = () => {
    try {
      if (!planData?.planItems || planData.planItems.length === 0) {
        showToast('No planned tasks available to export today.', 'info');
        return;
      }

      const headers = ['Type', 'Title', 'Scheduled Time', 'Duration', 'Priority', 'Status'];
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

      const rows = planData.planItems.map((item) =>
        [
          escape(item.type.toUpperCase()),
          escape(item.title),
          escape(item.startTime),
          escape(item.durationFormatted),
          escape((item.priority || 'medium').toUpperCase()),
          escape(item.isCompleted ? 'COMPLETED' : 'PENDING'),
        ].join(',')
      );

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `OfficeCompanion_Daily_Plan_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Daily plan exported to CSV!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export plan.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* 1. Header Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{planData?.date || 'Today'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Good morning, {user?.name || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Here's a practical, prioritized plan for your workday.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleExportPlanCsv}
            disabled={!planData?.planItems || planData.planItems.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-50"
            title="Download Daily Plan as CSV"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Adjust Plan</span>
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white text-xs font-semibold rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? (generatingStep || 'Regenerating...') : 'Regenerate Plan'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks Today</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-slate-900">{metrics?.tasksToday || 0}</span>
            <span className="text-xs font-medium text-slate-400">Scheduled</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">High Priority</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-red-600">{metrics?.highPriority || 0}</span>
            <span className="text-xs font-medium text-red-500">Urgent / High</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Estimated Work</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-brand-700">
              {metrics?.estimatedWorkFormatted || '0h'}
            </span>
            <span className="text-xs font-medium text-slate-400">Deep Effort</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Available Time</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-emerald-700">
              {metrics?.availableTimeFormatted || '8h'}
            </span>
            <span className="text-xs font-medium text-emerald-600">Workday Budget</span>
          </div>
        </div>
      </div>

      {/* 3. Daily Progress Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-slate-900">Today's Progress</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-ink-600">
            <span className="text-emerald-700 font-bold">{progress?.completed || 0} Completed</span>
            <span className="text-brand-700">{progress?.inProgress || 0} In Progress</span>
            <span className="text-ink-400">{progress?.remaining || 0} Remaining</span>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        {progress && progress.total > 0 ? (
          <div className="w-full h-3 bg-cream-200 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              title={`${progress.completed} completed`}
            />
            <div
              className="bg-brand-500 h-full transition-all duration-500"
              style={{ width: `${(progress.inProgress / progress.total) * 100}%` }}
              title={`${progress.inProgress} in progress`}
            />
          </div>
        ) : (
          <div className="w-full h-3 bg-cream-200 rounded-full" />
        )}
      </div>

      {/* 4. Schedule Items: Your Recommended Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Your Recommended Plan</h2>
            <p className="text-xs text-ink-500">
              Deterministic sequence ordered by overdue status, deadline proximity, priority, and effort.
            </p>
          </div>
          <span className="text-xs font-medium text-ink-400">
            {taskItems.length} planned items
          </span>
        </div>

        {planData?.planItems && planData.planItems.length > 0 ? (
          <div className="space-y-3">
            {planData.planItems.map((item, idx) => {
              if (item.type === 'break') {
                return (
                  <div
                    key={`break-${idx}`}
                    className="p-4 rounded-xl bg-amber-50/70 border border-dashed border-amber-200/80 flex items-center justify-between text-amber-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-800">
                            {item.startTime} — {item.endTime}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900">
                            {item.durationMinutes} min break
                          </span>
                        </div>
                        <div className="text-xs text-amber-700 font-medium mt-0.5">
                          {item.title} — {item.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const isFirst = idx === 0 || (idx === 1 && planData.planItems[0].type === 'break');
              const isCompleted = item.isCompleted;

              return (
                <div
                  key={item._id || `task-${idx}`}
                  className={`p-5 rounded-2xl bg-white card-subtle-border transition-all duration-200 ${
                    isCompleted ? 'opacity-70 bg-cream-50' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Time badge & Task info */}
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => item.taskId && handleToggleComplete(String(item.taskId))}
                        className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center transition-colors border ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-cream-400 hover:border-brand-500 text-transparent hover:text-brand-500'
                        }`}
                        title={isCompleted ? 'Completed' : 'Mark complete'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="space-y-1.5">
                        {/* Time and badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-cream-200 text-ink-800 text-xs font-bold font-mono">
                            {item.startTime} — {item.endTime}
                          </span>
                          <PriorityBadge priority={item.priority as PriorityLevel} size="sm" />
                          <span className="px-2 py-0.5 rounded-md bg-cream-100 border border-cream-300 text-ink-600 text-[11px] font-medium">
                            {item.durationFormatted}
                          </span>
                          {item.taskDetails?.deadline && (
                            <span className="text-[11px] text-ink-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-ink-400" />
                              Due {new Date(item.taskDetails.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                          {item.taskDetails?.status && (
                            <StatusBadge status={item.taskDetails.status} />
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => item.taskId && navigate(`/tasks/${item.taskId}`)}
                          className={`text-base font-bold cursor-pointer hover:text-brand-600 transition-colors ${
                            isCompleted ? 'line-through text-ink-400' : 'text-ink-900'
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Why this task is ordered here */}
                        {item.reason && (
                          <div className="p-2.5 rounded-xl bg-brand-50/60 border border-brand-100 text-xs text-brand-900 flex items-start gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-brand-800">
                                {isFirst ? 'Why this task is first: ' : 'Why scheduled here: '}
                              </span>
                              <span>{item.reason}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      {/* Move Up / Down */}
                      <div className="flex items-center bg-cream-100 rounded-xl p-1 border border-cream-300">
                        <button
                          onClick={() => handleMoveItem(idx, 'up')}
                          disabled={idx === 0 || isReordering}
                          className="p-1.5 text-ink-500 hover:text-ink-900 disabled:opacity-25 rounded-lg transition-colors"
                          title="Move earlier"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveItem(idx, 'down')}
                          disabled={idx === planData.planItems.length - 1 || isReordering}
                          className="p-1.5 text-ink-500 hover:text-ink-900 disabled:opacity-25 rounded-lg transition-colors"
                          title="Move later"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Start deep work session */}
                      {item.taskId && !isCompleted && (
                        <button
                          onClick={() => handleStartTask(String(item.taskId))}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-800 text-xs font-semibold rounded-xl transition-colors"
                          title="Start work session in Context Recovery"
                        >
                          <Play className="w-3.5 h-3.5 fill-brand-700" />
                          <span>Start</span>
                        </button>
                      )}

                      {/* Remove from plan */}
                      {item.taskId && (
                        <button
                          onClick={() => handleRemoveFromPlan(String(item.taskId))}
                          className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Remove from today's plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No tasks in today's plan"
            description="You don't have any active tasks scheduled for today. Add existing tasks or create new ones to build your daily plan."
            actionText="Add Existing Task"
            onAction={() => setIsAddTaskModalOpen(true)}
          />
        )}
      </div>

      {/* MODAL: Add Existing Task to Plan */}
      <Modal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        title="Add Task to Today's Plan"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-500">
            Select any active task from your workspace to incorporate it into today's schedule.
          </p>

          {planData?.availableTasks && planData.availableTasks.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {planData.availableTasks.map((t) => (
                <div
                  key={t._id}
                  className="p-3.5 rounded-xl border border-cream-300 hover:border-brand-300 bg-cream-50 hover:bg-white flex items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-ink-900">{t.title}</h4>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={t.priority} size="sm" />
                      <span className="text-[11px] text-ink-500">~{t.estimatedTime}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleIncludeTask(t._id)}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Add to Plan
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-ink-500">
              All active tasks are already scheduled in today's plan!
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsAddTaskModalOpen(false)}
              className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-ink-700 text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Adjust Plan Settings */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust Daily Plan Settings"
      >
        <div className="space-y-4 text-sm text-ink-700">
          <p className="text-xs text-ink-500">
            Configure your standard workday parameters for intelligent daily scheduling.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">
                Workday Start Time
              </label>
              <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 font-semibold text-ink-900">
                09:00 AM (Default)
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">
                Continuous Focus Window Limit
              </label>
              <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 text-xs text-ink-700">
                Automatic 15-minute breaks are scheduled after every 90 minutes of continuous deep work.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">
                Ordering Algorithm
              </label>
              <div className="p-3 rounded-xl bg-cream-100 border border-cream-300 text-xs text-ink-700">
                Deterministic: (1) Overdue tasks → (2) Due today → (3) Urgent/High impact → (4) Quick execution wins.
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
