import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Calendar,
  User,
  Trash2,
  Edit2,
  AlertCircle,
  Tag,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { FollowUp, FollowUpStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';

export const FollowUps: React.FC = () => {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [counts, setCounts] = useState<{ total: number; pending: number; due: number; overdue: number; completed: number }>({
    total: 0,
    pending: 0,
    due: 0,
    overdue: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'due' | 'overdue' | 'completed'>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FollowUp | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    person: '',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    source: 'Manual entry',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadFollowups = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.followups.getAll({ status: filter === 'all' ? undefined : filter });
      if (res.success) {
        setFollowups(res.data);
        if (res.counts) {
          setCounts(res.counts as any);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load follow-ups', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.person.trim()) {
      showToast('Please provide both an action/title and person name.', 'error');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.followups.create(formData);
      if (res.success) {
        showToast('Follow-up scheduled successfully!', 'success');
        setIsCreateOpen(false);
        setFormData({
          title: '',
          person: '',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
          source: 'Manual entry',
        });
        loadFollowups();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create follow-up', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      setIsSubmitting(true);
      const res = await api.followups.update(editingItem._id, {
        title: editingItem.title,
        person: editingItem.person,
        dueDate: editingItem.dueDate,
        source: editingItem.source,
      });
      if (res.success) {
        showToast('Follow-up updated.', 'success');
        setEditingItem(null);
        loadFollowups();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update follow-up', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await api.followups.complete(id);
      if (res.success) {
        showToast('Follow-up marked as completed!', 'success');
        loadFollowups();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to mark follow-up completed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.followups.delete(id);
      if (res.success) {
        showToast('Follow-up deleted.', 'success');
        setDeletingId(null);
        loadFollowups();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete follow-up', 'error');
    }
  };

  const filteredItems = followups.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.person.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: FollowUpStatus) => {
    switch (status) {
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            Overdue
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Due Soon
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-brand-400" />
            Follow-ups & Commitments
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Track promises, deliverables to colleagues, and external meeting commitments effortlessly.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Follow-up</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All', count: counts.total },
            { id: 'pending', label: 'Scheduled', count: counts.pending },
            { id: 'due', label: 'Due Soon', count: counts.due },
            { id: 'overdue', label: 'Overdue', count: counts.overdue },
            { id: 'completed', label: 'Completed', count: counts.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  filter === tab.id ? 'bg-brand-100 text-brand-700 font-bold' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search follow-ups or person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <LoadingSpinner message="Loading your commitments and follow-ups..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No follow-ups found"
          description={
            search
              ? `No follow-ups match "${search}". Try clearing the search query.`
              : 'You have no scheduled follow-ups in this category.'
          }
          actionText="Create Follow-up"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isCompleted = item.status === 'completed';
            const formattedDate = new Date(item.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl p-5 border transition-all hover:shadow-card group ${
                  item.status === 'overdue'
                    ? 'border-red-200 hover:border-red-300 bg-red-50/10'
                    : isCompleted
                    ? 'border-cream-200 bg-cream-50/50 opacity-80'
                    : 'border-cream-300 hover:border-brand-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(item.status)}
                      <span className="text-[11px] font-medium text-ink-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {item.source}
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold text-ink-900 leading-snug ${isCompleted ? 'line-through text-ink-400' : ''}`}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(item._id)}
                        title="Mark Completed"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingItem(item)}
                      title="Edit"
                      className="p-1.5 text-ink-500 hover:text-brand-600 hover:bg-cream-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(item._id)}
                      title="Delete"
                      className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cream-200/80 flex items-center justify-between text-xs text-ink-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    <span className="text-ink-900 font-semibold">{item.person}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-ink-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule New Follow-up"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Commitment / Action Item *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Send updated budget spreadsheet"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Person / Counterparty *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={formData.person}
                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Due Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Source / Context
            </label>
            <input
              type="text"
              placeholder="e.g. Marketing Standup, Slack thread"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-cream-200/60 hover:bg-cream-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-70"
            >
              {isSubmitting ? 'Scheduling...' : 'Save Follow-up'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title="Edit Follow-up"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Action Item *
              </label>
              <input
                type="text"
                required
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                  Person *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.person}
                  onChange={(e) => setEditingItem({ ...editingItem, person: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  required
                  value={new Date(editingItem.dueDate).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Source
              </label>
              <input
                type="text"
                value={editingItem.source}
                onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-300 rounded-xl text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-cream-200/60 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Update Follow-up'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingId(null)}
          title="Delete Follow-up"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">
                Are you sure you want to delete this scheduled follow-up? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-cream-200/60 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
