import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  Play,
  ArrowUpDown,
  AlertCircle,
  Download,
} from 'lucide-react';
import { api } from '../services/api';
import { Task, ImportanceLevel } from '../types';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { exportPredictedTasksToCsv } from '../utils/exportCsv';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentFilter = searchParams.get('filter') || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    importance: 'medium' as ImportanceLevel,
    estimatedTime: '45 mins',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.tasks.getAll({
        filter: currentFilter,
        search: searchQuery,
      });
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch tasks.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentFilter, searchQuery, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (filter: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', filter);
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value) {
      newParams.set('search', e.target.value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Please enter a task title.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.tasks.create(formData);
      if (res.success) {
        showToast('Task created successfully.', 'success');
        setIsCreateModalOpen(false);
        setFormData({
          title: '',
          description: '',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          importance: 'medium',
          estimatedTime: '45 mins',
        });
        fetchTasks();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setIsSubmitting(true);
      const res = await api.tasks.update(editingTask._id || editingTask.id!, {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        importance: formData.importance,
        estimatedTime: formData.estimatedTime,
      });
      if (res.success) {
        showToast('Task updated successfully.', 'success');
        setEditingTask(null);
        fetchTasks();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.tasks.complete(id);
      if (res.success) {
        showToast('Task completed! Great progress.', 'success');
        fetchTasks();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to complete task.', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      const res = await api.tasks.delete(deletingTaskId);
      if (res.success) {
        showToast('Task deleted.', 'info');
        setDeletingTaskId(null);
        fetchTasks();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task.', 'error');
    }
  };

  const handleStartTask = async (taskId: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.context.start(taskId);
      if (res.success) {
        showToast(`Work session started for "${title}"`, 'success');
        navigate('/context');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to start session.', 'error');
    }
  };

  const handlePrioritizeAll = async () => {
    try {
      setIsPrioritizing(true);
      const res = await api.ai.prioritize();
      if (res.success) {
        showToast('AI re-evaluated and prioritized all tasks!', 'success');
        fetchTasks();
      }
    } catch (err: any) {
      showToast('AI prioritization failed.', 'error');
    } finally {
      setIsPrioritizing(false);
    }
  };

  const openEditModal = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      importance: task.importance,
      estimatedTime: task.estimatedTime || '45 mins',
    });
  };

  const handleExportCsv = () => {
    try {
      if (tasks.length === 0) {
        showToast('No predicted tasks available to export. Create or load tasks first.', 'info');
        return;
      }
      exportPredictedTasksToCsv(tasks);
      showToast(`Exported ${tasks.length} AI predicted tasks to CSV!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to export tasks as CSV.', 'error');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'today', label: 'Due Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">My Tasks</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Create, track, and let AI evaluate priorities and context for your workload.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            disabled={isLoading || tasks.length === 0}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Download AI predicted tasks as CSV"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrioritizeAll}
            disabled={isPrioritizing}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-brand-700 border border-brand-200 rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
            <span>{isPrioritizing ? 'AI Analyzing...' : 'AI Prioritize All'}</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
                importance: 'medium',
                estimatedTime: '45 mins',
              });
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                currentFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <LoadingSpinner message="Loading your task list..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={
            searchQuery
              ? `No tasks matched "${searchQuery}". Try clearing search.`
              : currentFilter !== 'all'
              ? `No tasks found under the "${currentFilter}" filter.`
              : 'You have no tasks yet. Create your first task to see AI prioritization in action!'
          }
          actionText="Create First Task"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const taskId = task._id || task.id!;
            const deadlineDate = task.deadline ? new Date(task.deadline) : null;
            const deadlineStr = deadlineDate
              ? deadlineDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'No deadline';

            const isCompleted = task.status === 'completed';

            return (
              <div
                key={taskId}
                onClick={() => navigate(`/tasks/${taskId}`)}
                className={`p-5 bg-white rounded-2xl border transition-all duration-200 hover:shadow-card cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/50 opacity-75'
                    : 'border-slate-200 hover:border-brand-300'
                }`}
              >
                {/* Left Task Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <StatusBadge status={task.status} size="sm" />
                    {task.isOverdue && !isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Overdue
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-base font-bold transition-colors ${
                      isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-brand-600'
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* AI Explanation Snippet */}
                  {task.priorityReason && (
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-800 font-medium bg-brand-50/60 px-2.5 py-1 rounded-lg border border-brand-100/80 w-fit">
                      <Sparkles className="w-3 h-3 text-brand-600 shrink-0" />
                      <span>{task.priorityReason}</span>
                    </div>
                  )}
                </div>

                {/* Right Metadata & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-cream-200">
                  <div className="flex items-center gap-3 text-xs text-ink-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-ink-400" />
                      {deadlineStr}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-ink-400" />
                      {task.estimatedTime || '45 mins'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCompleted && (
                      <button
                        onClick={(e) => handleStartTask(taskId, task.title, e)}
                        className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Start Work Session"
                      >
                        <Play className="w-3.5 h-3.5 fill-brand-600" />
                        <span>Start</span>
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        onClick={(e) => handleCompleteTask(taskId, e)}
                        className="p-1.5 text-ink-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Mark Completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => openEditModal(task, e)}
                      className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-cream-100 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTaskId(taskId);
                      }}
                      className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Task"
        subtitle="AI will evaluate urgency, dependencies, and recommended order automatically."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Sales Report for Executive Sync"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Description / Requirements
            </label>
            <textarea
              rows={3}
              placeholder="Context, stakeholder dependencies, or key deliverables..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Estimated Effort
              </label>
              <input
                type="text"
                placeholder="e.g. 45 mins, 2 hours"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Business Importance
            </label>
            <select
              value={formData.importance}
              onChange={(e) => setFormData({ ...formData, importance: e.target.value as ImportanceLevel })}
              className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="urgent">Urgent - Blocker / Executive / Client Facing</option>
              <option value="high">High - High Business Impact</option>
              <option value="medium">Medium - Standard Priority</option>
              <option value="low">Low - Routine / Nice to Have</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        subtitle="Update task parameters and re-calculate priority."
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Deadline *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Estimated Effort
              </label>
              <input
                type="text"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Importance
            </label>
            <select
              value={formData.importance}
              onChange={(e) => setFormData({ ...formData, importance: e.target.value as ImportanceLevel })}
              className="w-full px-4 py-2 bg-cream-50/70 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
            <button
              type="button"
              onClick={() => setEditingTask(null)}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        title="Delete Task"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-xs sm:text-sm text-ink-600">
            Are you sure you want to delete this task and its work context checkpoints? This action cannot be undone.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setDeletingTaskId(null)}
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
