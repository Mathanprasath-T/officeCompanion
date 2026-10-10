import React, { useState } from 'react';
import { Clock, Sparkles, User, Calendar, Plus, Check } from 'lucide-react';
import { api } from '../../services/api';
import { CommitmentDetectionResult } from '../../types';
import { useToast } from '../../context/ToastContext';

interface QuickCommitmentCardProps {
  onFollowUpAdded: () => void;
}

export const QuickCommitmentCard: React.FC<QuickCommitmentCardProps> = ({ onFollowUpAdded }) => {
  const [inputText, setInputText] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [detectedResult, setDetectedResult] = useState<CommitmentDetectionResult | null>(null);
  const { showToast } = useToast();

  const handleDetect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      showToast('Please type a commitment statement to analyze.', 'error');
      return;
    }

    try {
      setIsDetecting(true);
      const res = await api.ai.detectCommitment(inputText.trim());
      if (res.success && res.data) {
        setDetectedResult(res.data);
        showToast('Commitment detected by AI!', 'success');
      } else {
        showToast(res.message || 'Could not detect structured commitment. You can add it manually.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Detection error.', 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveFollowUp = async () => {
    if (!detectedResult) return;
    try {
      setIsSaving(true);
      const res = await api.followups.create({
        title: detectedResult.action,
        person: detectedResult.person,
        dueDate: detectedResult.dueDate,
        source: `AI Detected from: "${inputText.trim()}"`,
      });
      if (res.success) {
        showToast(`Follow-up scheduled with ${detectedResult.person}!`, 'success');
        setInputText('');
        setDetectedResult(null);
        onFollowUpAdded();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save follow-up.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-amber-700">
            What did I promise to do?
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            AI Natural Language Follow-up Detection
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 mb-4">
        Paste any conversation snippet or note. AI automatically extracts the action, person, and deadline.
      </p>

      {/* Input Form */}
      <form onSubmit={handleDetect} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. I'll send the revised proposal to Rahul tomorrow..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isDetecting || !inputText.trim()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-200" />
            <span>{isDetecting ? 'Analyzing snippet...' : 'Detect Commitment'}</span>
          </button>
        </div>
      </form>

      {/* AI Extraction Result Preview Box */}
      {detectedResult && (
        <div className="mt-4 p-4 rounded-xl bg-brand-50/60 border border-brand-200 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-900 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Commitment Detected
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-semibold">
              {Math.round(detectedResult.confidence * 100)}% Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-brand-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Action</span>
              <span className="font-semibold text-slate-900">{detectedResult.action}</span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-brand-100 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Person</span>
                <span className="font-semibold text-slate-900">{detectedResult.person}</span>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-brand-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Due</span>
                <span className="font-semibold text-slate-900">
                  {new Date(detectedResult.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setDetectedResult(null)}
              className="px-3 py-1.5 text-xs text-ink-500 hover:text-ink-800 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFollowUp}
              disabled={isSaving}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all disabled:opacity-60"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Add Follow-up'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
