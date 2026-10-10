import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  BarChart3,
  PieChart,
  Lightbulb,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import {
  ProductivitySummary,
  WorkloadDay,
  TimeDistribution,
  ProductivityPatterns,
  WeeklyInsights,
} from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const ProductivityInsights: React.FC = () => {
  const [summary, setSummary] = useState<ProductivitySummary | null>(null);
  const [workload, setWorkload] = useState<WorkloadDay[]>([]);
  const [distribution, setDistribution] = useState<TimeDistribution | null>(null);
  const [patterns, setPatterns] = useState<ProductivityPatterns | null>(null);
  const [weekly, setWeekly] = useState<WeeklyInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useToast();

  const loadInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sumRes, workRes, distRes, patRes, weekRes] = await Promise.all([
        api.insights.getSummary(),
        api.insights.getWorkload(),
        api.insights.getDistribution(),
        api.insights.getActivityPatterns(),
        api.insights.getWeekly(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (workRes.success) setWorkload(workRes.data);
      if (distRes.success) setDistribution(distRes.data);
      if (patRes.success) setPatterns(patRes.data);
      if (weekRes.success) setWeekly(weekRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load productivity insights.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-80">
        <LoadingSpinner size="lg" message="Calculating your real productivity insights..." />
      </div>
    );
  }

  const kpis = summary?.kpis;

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl card-subtle-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Productivity Insights</span>
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">
            How You're Actually Working
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Real data-driven analytics computed from your verified tasks, follow-ups, and focus sessions.
          </p>
        </div>
      </div>

      {/* 2. KPI Cards (Real DB counts) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tasks Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tasks Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{kpis?.tasksCompleted || 0}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">
              Out of {kpis?.totalTasks || 0} total tasks
            </div>
          </div>
        </div>

        {/* High Priority Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              High Priority Done
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-red-600">{kpis?.highPriorityCompleted || 0}</div>
            <div className="text-xs text-red-500 font-semibold mt-0.5">Urgent & High Impact</div>
          </div>
        </div>

        {/* Follow-ups Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              Follow-ups Done
            </span>
            <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-brand-700">{kpis?.followUpsCompleted || 0}</div>
            <div className="text-xs text-brand-600 font-semibold mt-0.5">
              {kpis?.followUpCompletionRate || 0}% resolution rate
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Overdue Tasks
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-700">{kpis?.overdueTasks || 0}</div>
            <div className="text-xs text-amber-600 font-semibold mt-0.5">
              {kpis?.overdueTasks === 0 ? 'All caught up' : 'Needs attention'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Workload Overview (7-Day Recharts Bar Chart) */}
      <div className="bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-ink-900">Workload Overview (Past 7 Days)</h3>
            <p className="text-xs text-ink-500">
              Completed tasks vs active/remaining workload across the week.
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#64607D', fontSize: 12 }} stroke="#ECE7DC" />
              <YAxis allowDecimals={false} tick={{ fill: '#64607D', fontSize: 12 }} stroke="#ECE7DC" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #ECE7DC',
                  boxShadow: '0 4px 12px rgba(30, 27, 46, 0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="completed" name="Completed Tasks" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="remaining" name="Active / Remaining" fill="#7C5CFC" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Time Distribution & Productivity Patterns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Time Distribution (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-ink-900">Time Distribution</h3>
            <p className="text-xs text-ink-500">
              Breakdown of tracked work session activity by category.
            </p>
          </div>

          {distribution && distribution.hasEnoughData ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-600 pb-1 border-b border-cream-200">
                <span>Total Tracked Activity</span>
                <span className="text-brand-700 font-bold">{distribution.totalTrackedFormatted}</span>
              </div>

              <div className="space-y-3">
                {distribution.distribution.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-800">{item.category}</span>
                      <span className="font-bold text-ink-600">{item.minutes} min ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 px-4 rounded-xl bg-cream-50 border border-dashed border-cream-300 text-center space-y-2 my-auto">
              <Info className="w-6 h-6 text-brand-500 mx-auto" />
              <h4 className="text-sm font-bold text-ink-800">Not enough activity data yet</h4>
              <p className="text-xs text-ink-500 max-w-sm mx-auto">
                {distribution?.explanation ||
                  'Time distribution requires tracked work sessions. Start working on tasks through Context Recovery to record actual time spent.'}
              </p>
            </div>
          )}
        </div>

        {/* Right: Productivity Patterns (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-ink-900">Productivity Patterns</h3>
            <p className="text-xs text-ink-500">
              Empirical patterns calculated from real task completions and timestamps.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-xl bg-brand-50/60 border border-brand-200/80 space-y-1">
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Peak Activity Window
              </span>
              <div className="text-base font-bold text-ink-900">
                {patterns?.peakWindow || 'Standard Workday'}
              </div>
              <p className="text-xs text-brand-900">
                {patterns?.peakObservation}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-cream-100/70 border border-cream-300 space-y-1">
                <span className="text-[11px] font-bold text-ink-500 uppercase">Avg Task Effort</span>
                <div className="text-xl font-extrabold text-ink-900">
                  {patterns?.averageTaskDuration || '45 mins'}
                </div>
                <div className="text-[11px] text-ink-400">Estimated duration</div>
              </div>

              <div className="p-4 rounded-xl bg-cream-100/70 border border-cream-300 space-y-1">
                <span className="text-[11px] font-bold text-ink-500 uppercase">Follow-up Rate</span>
                <div className="text-xl font-extrabold text-emerald-700">
                  {patterns?.followUpCompletionRate || '0%'}
                </div>
                <div className="text-[11px] text-ink-400">Resolution fidelity</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AI Weekly Insights & Practical Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Observations (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="text-base font-bold text-ink-900">Your Weekly Insights</h3>
              <p className="text-xs text-ink-500">AI interpretation of verified weekly metrics.</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {weekly?.observations && weekly.observations.length > 0 ? (
              weekly.observations.map((obs, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 text-xs text-ink-800 font-medium flex items-start gap-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{obs}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-400 text-center py-4">
                Complete more tasks this week to unlock weekly observations.
              </p>
            )}
          </div>
        </div>

        {/* Practical Suggestions for Next Week (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl card-subtle-border shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-ink-900">Suggestions for Next Week</h3>
              <p className="text-xs text-ink-500">Actionable optimizations based on real data.</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {weekly?.suggestions && weekly.suggestions.length > 0 ? (
              weekly.suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-cream-300 hover:border-amber-300 bg-cream-50/50 hover:bg-white transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-ink-900">{sug.title}</h4>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                      {sug.tag}
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 leading-relaxed">{sug.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-400 text-center py-4">
                Continue organizing your tasks to generate tailored recommendations.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
