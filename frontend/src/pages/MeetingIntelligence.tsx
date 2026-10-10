import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Plus,
  ArrowRight,
  Trash2,
  Calendar,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Edit2,
  Check,
  Send,
} from 'lucide-react';
import { api } from '../services/api';
import { Meeting, MeetingActionItem, MeetingCommitment, PriorityLevel, Task } from '../types';
import { PriorityBadge } from '../components/common/PriorityBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

const SAMPLE_NOTES = `Discussed the Q4 marketing campaign with Rahul and Mathan.
Rahul will prepare the revised proposal by Wednesday.
Mathan will review the campaign metrics and target ROAS.
The team agreed to launch the campaign next Monday.
I'll send the revised proposal to Rahul tomorrow morning for review.`;

export const MeetingIntelligence: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Edit action item modal
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [editingActionData, setEditingActionData] = useState<{
    action: string;
    person: string;
    deadline: string;
    priority: PriorityLevel;
    estimatedTime: string;
  }>({
    action: '',
    person: '',
    deadline: 'Wednesday',
    priority: 'high',
    estimatedTime: '45 mins',
  });

  const [creatingTaskIndex, setCreatingTaskIndex] = useState<number | null>(null);
  const [creatingFollowUpIndex, setCreatingFollowUpIndex] = useState<number | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const res = await api.meetings.getAll();
      if (res.success && res.data) {
        setMeetings(res.data);
        if (res.data.length > 0 && !selectedMeeting) {
          setSelectedMeeting(res.data[0]);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load meeting history.', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [showToast, selectedMeeting]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const handleAnalyze = async () => {
    if (!notesInput.trim()) {
      showToast('Please paste your meeting notes or conversation first.', 'error');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalyzingStep('Analyzing notes...');
      await new Promise((r) => setTimeout(r, 250));
      setAnalyzingStep('Extracting decisions...');
      await new Promise((r) => setTimeout(r, 250));
      setAnalyzingStep('Finding action items...');
      await new Promise((r) => setTimeout(r, 250));
      setAnalyzingStep('Detecting commitments...');

      const res = await api.meetings.analyze(notesInput);
      if (res.success && res.data) {
        setMeetings((prev) => [res.data, ...prev]);
        setSelectedMeeting(res.data);
        setNotesInput('');
        showToast('Meeting notes successfully analyzed and structured!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to analyze meeting notes.', 'error');
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep('');
    }
  };

  const handleCreateTask = async (actionIndex: number) => {
    if (!selectedMeeting) return;

    try {
      setCreatingTaskIndex(actionIndex);
      const res = await api.meetings.createTask(selectedMeeting._id, actionIndex);
      if (res.success && res.data) {
        showToast(`Task "${res.data.title}" added to your Tasks module!`, 'success');
        // Refresh meeting details
        const updatedMeetingRes = await api.meetings.getById(selectedMeeting._id);
        if (updatedMeetingRes.success) {
          setSelectedMeeting(updatedMeetingRes.data);
          setMeetings((prev) =>
            prev.map((m) => (m._id === selectedMeeting._id ? updatedMeetingRes.data : m))
          );
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create task.', 'error');
    } finally {
      setCreatingTaskIndex(null);
    }
  };

  const handleCreateFollowUp = async (commitmentIndex: number) => {
    if (!selectedMeeting) return;

    try {
      setCreatingFollowUpIndex(commitmentIndex);
      const res = await api.meetings.createFollowUp(selectedMeeting._id, commitmentIndex);
      if (res.success && res.data) {
        showToast(`Follow-up with ${res.data.person} created in Follow-ups module!`, 'success');
        // Refresh meeting details
        const updatedMeetingRes = await api.meetings.getById(selectedMeeting._id);
        if (updatedMeetingRes.success) {
          setSelectedMeeting(updatedMeetingRes.data);
          setMeetings((prev) =>
            prev.map((m) => (m._id === selectedMeeting._id ? updatedMeetingRes.data : m))
          );
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to create follow-up.', 'error');
    } finally {
      setCreatingFollowUpIndex(null);
    }
  };

  const handleSaveEditAction = async () => {
    if (!selectedMeeting || editingActionIndex === null) return;
    try {
      setCreatingTaskIndex(editingActionIndex);
      const res = await api.meetings.createTask(selectedMeeting._id, editingActionIndex, {
        title: editingActionData.action,
        importance: editingActionData.priority,
        estimatedTime: editingActionData.estimatedTime,
        deadline: editingActionData.deadline as any,
        person: editingActionData.person as any,
      } as any);
      if (res.success && res.data) {
        showToast(`Task "${res.data.title}" created with custom values!`, 'success');
        setEditingActionIndex(null);
        const updatedMeetingRes = await api.meetings.getById(selectedMeeting._id);
        if (updatedMeetingRes.success) {
          setSelectedMeeting(updatedMeetingRes.data);
          setMeetings((prev) =>
            prev.map((m) => (m._id === selectedMeeting._id ? updatedMeetingRes.data : m))
          );
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save task.', 'error');
    } finally {
      setCreatingTaskIndex(null);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await api.meetings.delete(meetingId);
      setMeetings((prev) => prev.filter((m) => m._id !== meetingId));
      if (selectedMeeting?._id === meetingId) {
        const remaining = meetings.filter((m) => m._id !== meetingId);
        setSelectedMeeting(remaining.length > 0 ? remaining[0] : null);
      }
      showToast('Meeting record removed.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete meeting.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl card-subtle-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Meeting & Note Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">
            Transform Notes into Action Items
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Paste raw meeting notes to automatically extract summaries, decisions, action items, and follow-ups.
          </p>
        </div>
      </div>

      {/* 2. Input Section */}
      <div className="bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-ink-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>Add Meeting Notes</span>
          </label>
          <button
            onClick={() => setNotesInput(SAMPLE_NOTES)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
          >
            Insert Sample Notes
          </button>
        </div>

        <div className="relative">
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            rows={5}
            placeholder="Paste your meeting notes or conversation here... e.g.
Discussed the Q4 marketing campaign.
Rahul will prepare the revised proposal by Wednesday.
Mathan will review the campaign metrics.
The team agreed to launch the campaign next Monday."
            className="w-full p-4 rounded-xl border border-cream-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm text-ink-900 bg-cream-50/50 resize-y font-sans leading-relaxed"
          />
        </div>

        <div className="flex justify-between items-center pt-1">
          <span className="text-xs text-ink-400">
            AI extracts structured Summary → Decisions → Action Items → Follow-ups.
          </span>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !notesInput.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-70 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? (analyzingStep || 'Analyzing Notes...') : 'Analyze Notes'}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Workspace: Analysis Details (Left 8 cols) + History (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Active Meeting Analysis Breakdown */}
        <div className="lg:col-span-8 space-y-6">
          {selectedMeeting ? (
            <div className="space-y-6">
              {/* Meeting Header */}
              <div className="bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-ink-400 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(selectedMeeting.createdAt).toLocaleString()}</span>
                    </div>
                    <h2 className="text-xl font-bold text-ink-900">{selectedMeeting.title}</h2>
                  </div>
                  <button
                    onClick={() => handleDeleteMeeting(selectedMeeting._id)}
                    className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete meeting analysis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Summary Section */}
                <div className="pt-2 border-t border-cream-200">
                  <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1.5">
                    Meeting Summary
                  </h3>
                  <p className="text-sm text-ink-800 leading-relaxed bg-cream-50 p-4 rounded-xl border border-cream-200">
                    {selectedMeeting.summary}
                  </p>
                </div>

                {/* Key Decisions */}
                {selectedMeeting.decisions && selectedMeeting.decisions.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-2">
                      Key Decisions ({selectedMeeting.decisions.length})
                    </h3>
                    <ul className="space-y-2">
                      {selectedMeeting.decisions.map((dec, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-950 text-xs font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{dec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Items List */}
              <div className="bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
                    Action Items ({selectedMeeting.actionItems?.length || 0})
                  </h3>
                  <span className="text-xs text-ink-400">Convert directly into workspace Tasks</span>
                </div>

                {selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedMeeting.actionItems.map((item, idx) => {
                      const isTaskCreated = Boolean(item.taskId);
                      const isCreating = creatingTaskIndex === idx;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-cream-300 hover:border-brand-300 bg-cream-50/60 hover:bg-white transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-ink-900">{item.action}</h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
                                <span className="flex items-center gap-1 font-semibold text-ink-700">
                                  <User className="w-3.5 h-3.5 text-brand-600" />
                                  Owner: {item.person}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-ink-400" />
                                  Due: {item.deadline}
                                </span>
                                <PriorityBadge priority={item.priority} size="sm" />
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isTaskCreated ? (
                                <button
                                  onClick={() => {
                                    const taskId = typeof item.taskId === 'object' ? item.taskId?._id : item.taskId;
                                    navigate(taskId ? `/tasks/${taskId}` : '/tasks');
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-200 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Task Created ✓</span>
                                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingActionIndex(idx);
                                      setEditingActionData({
                                        action: item.action,
                                        person: item.person,
                                        deadline: item.deadline,
                                        priority: item.priority,
                                        estimatedTime: item.estimatedTime || '45 mins',
                                      });
                                    }}
                                    className="p-1.5 text-ink-500 hover:text-ink-900 hover:bg-cream-200 rounded-lg transition-colors"
                                    title="Edit before creating task"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCreateTask(idx)}
                                    disabled={isCreating}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>{isCreating ? 'Creating...' : 'Create Task'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ink-400 py-4 text-center">
                    No action items extracted from these notes.
                  </p>
                )}
              </div>

              {/* Detected Commitments (Follow-ups) */}
              {selectedMeeting.commitments && selectedMeeting.commitments.length > 0 && (
                <div className="bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <span>Detected Commitments ({selectedMeeting.commitments.length})</span>
                    </h3>
                    <span className="text-xs text-ink-400">Direct integration with Follow-up module</span>
                  </div>

                  <div className="space-y-3">
                    {selectedMeeting.commitments.map((c, idx) => {
                      const isFollowUpCreated = Boolean(c.followUpId);
                      const isCreating = creatingFollowUpIndex === idx;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-gradient-to-r from-brand-50/50 to-cream-50 border border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-ink-900">{c.action}</h4>
                            <div className="flex items-center gap-3 text-xs text-ink-600">
                              <span className="font-semibold text-brand-700">Person: {c.person}</span>
                              <span>Due: {new Date(c.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800 text-[10px] font-bold">
                                Confidence: {Math.round((c.confidence || 0.9) * 100)}%
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isFollowUpCreated ? (
                              <button
                                onClick={() => navigate('/followups')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg hover:bg-emerald-200 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Follow-up Created ✓</span>
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCreateFollowUp(idx)}
                                disabled={isCreating}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isCreating ? 'Scheduling...' : 'Create Follow-up'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No meeting selected"
              description="Paste meeting notes above and click Analyze Notes, or pick a meeting from your history."
              actionText="Insert Sample Notes"
              onAction={() => setNotesInput(SAMPLE_NOTES)}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Meeting History Stream */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
              Meeting History ({meetings.length})
            </h3>
          </div>

          {isLoadingHistory ? (
            <div className="p-8 text-center bg-white rounded-2xl card-subtle-border">
              <LoadingSpinner size="sm" message="Loading history..." />
            </div>
          ) : meetings.length > 0 ? (
            <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
              {meetings.map((m) => {
                const isSelected = selectedMeeting?._id === m._id;
                return (
                  <div
                    key={m._id}
                    onClick={() => setSelectedMeeting(m)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-50 border-brand-300 shadow-sm ring-1 ring-brand-300'
                        : 'bg-white border-cream-300 hover:border-cream-400 hover:bg-cream-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-ink-900 line-clamp-1">{m.title}</h4>
                      <span className="text-[10px] font-medium text-ink-400 shrink-0">
                        {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="text-xs text-ink-500 line-clamp-2 mt-1">{m.summary}</p>

                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-cream-200 text-[11px] font-semibold text-ink-600">
                      <span className="px-2 py-0.5 rounded bg-cream-200 text-ink-800">
                        {m.actionItems?.length || 0} Actions
                      </span>
                      {m.commitments?.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                          {m.commitments.length} Follow-ups
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center bg-white rounded-2xl card-subtle-border text-xs text-ink-400">
              No meetings analyzed yet. Paste notes above to get started.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Edit Action Item before creating task */}
      <Modal
        isOpen={editingActionIndex !== null}
        onClose={() => setEditingActionIndex(null)}
        title="Edit & Create Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Task Title</label>
            <input
              type="text"
              value={editingActionData.action}
              onChange={(e) => setEditingActionData({ ...editingActionData, action: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-cream-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Owner</label>
              <input
                type="text"
                value={editingActionData.person}
                onChange={(e) => setEditingActionData({ ...editingActionData, person: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-cream-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Priority</label>
              <select
                value={editingActionData.priority}
                onChange={(e) => setEditingActionData({ ...editingActionData, priority: e.target.value as PriorityLevel })}
                className="w-full p-2.5 rounded-xl border border-cream-300 text-sm bg-white"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Target Deadline</label>
              <input
                type="text"
                value={editingActionData.deadline}
                onChange={(e) => setEditingActionData({ ...editingActionData, deadline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-cream-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Estimated Time</label>
              <input
                type="text"
                value={editingActionData.estimatedTime}
                onChange={(e) => setEditingActionData({ ...editingActionData, estimatedTime: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-cream-300 text-sm"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              onClick={() => setEditingActionIndex(null)}
              className="px-4 py-2 bg-cream-200 hover:bg-cream-300 text-ink-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditAction}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Save & Create Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
