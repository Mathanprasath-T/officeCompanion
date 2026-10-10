import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Play,
  CheckCircle2,
  Edit2,
  Trash2,
  Compass,
  Activity as ActivityIcon,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Task, WorkSession, Activity, ImportanceLevel } from '../types';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { useToast } from '../context/ToastContext';

export const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [latestSession, setLatestSession] = useState<WorkSession | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit & Delete modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    importance: 'medium' as ImportanceLevel,
    estimatedTime: '',
  });

  const fetchTaskDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await api.tasks.getById(id);
      if (res.success && res.data) {
        setTask(res.data.task);
        setLatestSession(res.data.latestSession);
        setActivities(res.data.activities || []);
        setFormData({
          title: res.data.task.title,
          description: res.data.task.description || '',
          deadline: res.data.task.deadline
            ? new Date(res.data.task.deadline).toISOString().slice(0, 16)
            : '',
          importance: res.data.task.importance,
          estimatedTime: res.data.task.estimatedTime || '45 mins',
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Task not found.', 'error');
      navigate('/tasks');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const handleStartTask = async () => {
    if (!task) return;
    try {
      const res = await api.context.start(task._id || task.id!);
      if (res.success) {
        showToast(`Work session active for "${task.title}"`, 'success');
        navigate('/context');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to start session.', 'error');
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    try {
      const res = await api.tasks.complete(task._id || task.id!);
      if (res.success) {
        showToast('Task marked as completed!', 'success');
        fetchTaskDetails();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete task.', 'error');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    try {
      const res = await api.tasks.update(task._id || task.id!, formData);
      if (res.success) {
        showToast('Task updated successfully.', 'success');
        setIsEditOpen(false);
        fetchTaskDetails();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update task.', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    try {
      const res = await api.tasks.delete(task._id || task.id!);
      if (res.success) {
        showToast('Task deleted successfully.', 'info');
        navigate('/tasks');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task.', 'error');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading task details..." size="lg" />;
  }

  if (!task) {
    return null;
  }

  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const deadlineStr = deadlineDate
    ? deadlineDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No deadline set';

  const isCompleted = task.status === 'completed';

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto animate-page-enter">
      {/* Back Button */}
      <button
        onClick={() => navigate('/tasks')}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Tasks</span>
      </button>

      {/* Main Task Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              <span className="text-xs text-ink-400 font-medium">
                Created {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900 tracking-tight">
              {task.title}
            </h1>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start">
            {!isCompleted && (
              <button
                onClick={handleStartTask}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Task</span>
              </button>
            )}

            {!isCompleted && (
              <button
                onClick={handleCompleteTask}
                className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete</span>
              </button>
            )}

            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2.5 text-ink-600 hover:text-ink-900 hover:bg-cream-100 rounded-xl border border-cream-300 transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-2.5 text-ink-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-cream-300 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Priority Rationale Banner */}
        <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-900 uppercase tracking-wide">
              AI Priority Evaluation & Reason
            </span>
            <p className="text-xs sm:text-sm text-brand-950 leading-relaxed font-medium">
              {task.priorityReason || 'Evaluated based on deadlines and task characteristics.'}
            </p>
          </div>
        </div>

        {/* Task Metadata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-cream-200">
          <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-200">
            <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-1">
              Deadline
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-900">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>{deadlineStr}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-200">
            <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-1">
              Estimated Effort
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-900">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>{task.estimatedTime || '45 mins'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cream-50/80 border border-cream-200">
            <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider block mb-1">
              Importance Rating
            </span>
            <span className="text-xs sm:text-sm font-semibold text-ink-900 capitalize">
              {task.importance} Priority
            </span>
          </div>
        </div>

        {/* Task Description */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider">
            Description & Context
          </h3>
          <div className="p-4 rounded-xl bg-cream-50/40 border border-cream-200 text-xs sm:text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
            {task.description || 'No additional description provided for this task.'}
          </div>
        </div>
      </div>

      {/* Latest Saved Work Session & Context Checkpoints */}
      {latestSession && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-ink-900">Saved Work Session Context</h2>
            </div>

            <button
              onClick={() => navigate('/context')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Open Context Recovery →
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50/60 border border-cream-200 space-y-3 text-xs sm:text-sm">
            {latestSession.currentContext && (
              <div>
                <span className="text-[11px] font-bold text-ink-400 uppercase block mb-1">
                  Last Working Note
                </span>
                <p className="text-ink-800 italic">"{latestSession.currentContext}"</p>
              </div>
            )}

            {latestSession.nextAction && (
              <div>
                <span className="text-[11px] font-bold text-ink-400 uppercase block mb-1">
                  Saved Next Action
                </span>
                <p className="font-bold text-brand-700">{latestSession.nextAction}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Specific Activity History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-ink-900">Task Activity Stream</h2>
        </div>

        {activities.length === 0 ? (
          <p className="text-xs text-ink-400 py-4 text-center">No recorded activity for this task yet.</p>
        ) : (
          <div className="divide-y divide-cream-200">
            {activities.map((act) => (
              <div key={act._id} className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-ink-900">{act.description}</span>
                <span className="text-ink-400">
                  {new Date(act.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Task Details">
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">Deadline</label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">Effort</label>
              <input
                type="text"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Task" maxWidth="sm">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm text-ink-600">
            Are you sure you want to permanently delete "{task.title}"?
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTask}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
