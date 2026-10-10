import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Plus,
  Save,
  Clock,
  ArrowRight,
  Sparkles,
  Check,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { WorkSession } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

export const ContextRecovery: React.FC = () => {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Active session editor state
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [remainingActions, setRemainingActions] = useState<string[]>([]);
  const [currentContext, setCurrentContext] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [newActionInput, setNewActionInput] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.context.getRecent();
      if (res.success && res.data) {
        setSessions(res.data);
        if (res.data.length > 0 && !selectedSessionId) {
          const initial = res.data[0];
          setSelectedSessionId(initial._id);
          populateEditor(initial);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch work sessions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSessionId, showToast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const populateEditor = (session: WorkSession) => {
    setCompletedActions(session.completedActions || []);
    setRemainingActions(session.remainingActions || []);
    setCurrentContext(session.currentContext || '');
    setNextAction(session.nextAction || '');
  };

  const activeSession = sessions.find((s) => s._id === selectedSessionId) || sessions[0];

  const handleSelectSession = (session: WorkSession) => {
    setSelectedSessionId(session._id);
    populateEditor(session);
  };

  // Toggle action from remaining to completed
  const handleCompleteAction = (index: number) => {
    const item = remainingActions[index];
    const newRemaining = remainingActions.filter((_, i) => i !== index);
    const newCompleted = [...completedActions, item];
    setRemainingActions(newRemaining);
    setCompletedActions(newCompleted);

    // Update next action to next remaining if exists
    if (newRemaining.length > 0) {
      setNextAction(newRemaining[0]);
    }
  };

  // Toggle action back to remaining
  const handleUncompleteAction = (index: number) => {
    const item = completedActions[index];
    const newCompleted = completedActions.filter((_, i) => i !== index);
    const newRemaining = [item, ...remainingActions];
    setCompletedActions(newCompleted);
    setRemainingActions(newRemaining);
  };

  const handleAddRemainingAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionInput.trim()) return;
    const updated = [...remainingActions, newActionInput.trim()];
    setRemainingActions(updated);
    if (!nextAction) {
      setNextAction(newActionInput.trim());
    }
    setNewActionInput('');
  };

  const handleSaveContext = async () => {
    if (!activeSession) return;
    try {
      setIsSaving(true);
      const res = await api.context.update(activeSession._id, {
        completedActions,
        remainingActions,
        currentContext,
        nextAction,
      });
      if (res.success) {
        showToast('Work context checkpoint saved to database.', 'success');
        fetchSessions();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save context.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;
    try {
      const res = await api.context.resume(activeSession._id);
      if (res.success) {
        showToast('Work session resumed.', 'success');
        fetchSessions();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resume session.', 'error');
    }
  };

  const handleCompleteTask = async () => {
    if (!activeSession) return;
    const taskId = typeof activeSession.taskId === 'object' ? activeSession.taskId._id : activeSession.taskId;
    try {
      await api.tasks.complete(taskId);
      showToast('Task and associated session marked as completed!', 'success');
      fetchSessions();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete task.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Context Recovery</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Never lose your place. AI captures work checkpoints, completed milestones, and exact next actions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading work sessions and context state..." />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No active context sessions"
          description="When you start working on any task, OfficeCompanion automatically creates a persistent work session with checkpoints."
          actionText="Go to Tasks & Start One"
          onAction={() => navigate('/tasks')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Session List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 px-1">
              Recent Sessions ({sessions.length})
            </h2>

            <div className="space-y-2.5">
              {sessions.map((sess) => {
                const isSelected = sess._id === activeSession?._id;
                const taskObj = typeof sess.taskId === 'object' ? sess.taskId : null;
                const title = taskObj?.title || 'Active Task';

                return (
                  <div
                    key={sess._id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                      isSelected
                        ? 'bg-white border-brand-500 shadow-md ring-2 ring-brand-500/10'
                        : 'bg-white/80 border-cream-300 hover:border-cream-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <StatusBadge status={sess.status} size="sm" />
                      <span className="text-[10px] text-ink-400 font-medium">
                        {new Date(sess.lastActiveAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-ink-900 line-clamp-1">{title}</h3>

                    {sess.nextAction && (
                      <p className="text-xs text-brand-700 font-medium mt-1 line-clamp-1 flex items-center gap-1">
                        <span>Next:</span> {sess.nextAction}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Active Work Session Board (8 cols) */}
          {activeSession && (
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-soft space-y-6">
              {/* Board Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Active Context Snapshot
                  </span>
                  <h2 className="text-xl font-extrabold text-ink-900 mt-0.5">
                    {typeof activeSession.taskId === 'object' ? activeSession.taskId.title : 'Task Session'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResumeSession}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={handleCompleteTask}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </button>
                </div>
              </div>

              {/* Working Context Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  <span>Current Working Notes / Context State</span>
                </label>
                <textarea
                  rows={3}
                  value={currentContext}
                  onChange={(e) => setCurrentContext(e.target.value)}
                  placeholder="Note where you stopped (e.g. Working on slide 4 revenue variance...)"
                  className="w-full p-4 bg-cream-50/70 border border-cream-300 rounded-2xl text-xs sm:text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              {/* Next Action Callout */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Immediate Next Action When You Return</span>
                </label>
                <input
                  type="text"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="e.g. Draft executive summary commentary"
                  className="w-full px-4 py-2.5 bg-cream-50/70 border border-cream-300 rounded-xl text-xs sm:text-sm font-semibold text-brand-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              {/* Checkpoints Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Remaining Checkpoints */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
                    Remaining Checklist ({remainingActions.length})
                  </span>

                  <div className="space-y-2">
                    {remainingActions.map((action, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCompleteAction(idx)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/70 hover:bg-amber-100/60 cursor-pointer transition-colors text-xs font-medium text-ink-900 group"
                      >
                        <Circle className="w-4 h-4 text-amber-500 shrink-0 group-hover:text-emerald-600 transition-colors" />
                        <span className="flex-1">{action}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add action item form */}
                  <form onSubmit={handleAddRemainingAction} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add next checklist item..."
                      value={newActionInput}
                      onChange={(e) => setNewActionInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-cream-50/70 border border-cream-300 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-cream-200 hover:bg-cream-300 text-ink-800 rounded-xl transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Completed Checkpoints */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                    Completed Milestones ({completedActions.length})
                  </span>

                  <div className="space-y-2">
                    {completedActions.map((action, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleUncompleteAction(idx)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200/60 hover:bg-emerald-50 cursor-pointer transition-colors text-xs text-ink-600 line-through"
                        title="Click to move back to remaining"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="flex-1">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                <span className="text-xs text-ink-400">
                  Last active: {new Date(activeSession.lastActiveAt).toLocaleString()}
                </span>

                <button
                  onClick={handleSaveContext}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Context Checkpoint'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
