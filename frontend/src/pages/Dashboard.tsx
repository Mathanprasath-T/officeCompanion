import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { GreetingSection } from '../components/dashboard/GreetingSection';
import { StatCard } from '../components/dashboard/StatCard';
import { WhatToDoNowCard } from '../components/dashboard/WhatToDoNowCard';
import { ContextRecoveryBanner } from '../components/dashboard/ContextRecoveryBanner';
import { QuickCommitmentCard } from '../components/dashboard/QuickCommitmentCard';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { api } from '../services/api';
import {
  PriorityRecommendation,
  WorkSession,
  Activity,
  TaskCounts,
  DailyPlanResponse,
  Meeting,
  ProductivitySummary,
} from '../types';
import { useToast } from '../context/ToastContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<PriorityRecommendation | null>(null);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [counts, setCounts] = useState<TaskCounts>({
    total: 0,
    urgent: 0,
    today: 0,
    later: 0,
    completed: 0,
  });
  const [dailyPlan, setDailyPlan] = useState<DailyPlanResponse | null>(null);
  const [latestMeeting, setLatestMeeting] = useState<Meeting | null>(null);
  const [productivitySummary, setProductivitySummary] = useState<ProductivitySummary | null>(null);

  const [loadingRecommendation, setLoadingRecommendation] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const { showToast } = useToast();

  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Task counts
      const taskRes = await api.tasks.getAll();
      if (taskRes.success && taskRes.counts) {
        setCounts(taskRes.counts);
      }

      // 2. Fetch AI recommendation
      setLoadingRecommendation(true);
      const recRes = await api.ai.getRecommendation();
      if (recRes.success) {
        setRecommendation(recRes.data);
      }

      // 3. Fetch Recent Context Sessions
      const contextRes = await api.context.getRecent();
      if (contextRes.success && contextRes.data && contextRes.data.length > 0) {
        const latest = contextRes.data[0];
        setActiveSession(latest);
      } else {
        setActiveSession(null);
      }

      // 4. Fetch Recent Activities
      setLoadingActivities(true);
      const actRes = await api.activity.getAll({ limit: 5 });
      if (actRes.success) {
        setActivities(actRes.data);
      }

      // 5. Fetch Daily Plan Widget Data
      try {
        const planRes = await api.planner.getToday();
        if (planRes.success && planRes.data) {
          setDailyPlan(planRes.data);
        }
      } catch (e) {
        // Non-blocking
      }

      // 6. Fetch Latest Meeting Widget Data
      try {
        const meetRes = await api.meetings.getAll();
        if (meetRes.success && meetRes.data && meetRes.data.length > 0) {
          setLatestMeeting(meetRes.data[0]);
        }
      } catch (e) {
        // Non-blocking
      }

      // 7. Fetch Productivity Insights Widget Data
      try {
        const prodRes = await api.insights.getSummary();
        if (prodRes.success && prodRes.data) {
          setProductivitySummary(prodRes.data);
        }
      } catch (e) {
        // Non-blocking
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      showToast('Could not refresh dashboard data. Please try again.', 'error');
    } finally {
      setLoadingRecommendation(false);
      setLoadingActivities(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleReevaluateAI = async () => {
    try {
      setLoadingRecommendation(true);
      await api.ai.prioritize();
      showToast('AI re-prioritized all tasks based on current deadlines & dependencies.', 'success');
      await loadDashboardData();
    } catch (err: any) {
      showToast('Re-evaluation failed.', 'error');
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Find next planned task for widget
  const nextPlannedTask = dailyPlan?.planItems?.find(
    (item) => item.type === 'task' && !item.isCompleted
  );

  return (
    <div className="space-y-6 pb-12 animate-page-enter">
      {/* 1. Greeting Section */}
      <GreetingSection />

      {/* 2. Real Task Counts Grid */}
      <StatCard
        urgent={counts.urgent}
        today={counts.today}
        later={counts.later}
        completed={counts.completed}
      />

      {/* 3. New Modules Quick Hub Widgets (Daily Planner, Meeting Intelligence, Productivity Insights) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Plan Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Today's Plan</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {dailyPlan?.metrics?.tasksToday || 0} scheduled
              </span>
            </div>

            {nextPlannedTask ? (
              <div>
                <div className="text-xs text-slate-500 font-medium">Next Planned Task:</div>
                <div className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
                  {nextPlannedTask.title}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                    {nextPlannedTask.startTime}
                  </span>
                  <span>~{nextPlannedTask.durationFormatted}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-1">
                {dailyPlan?.metrics?.tasksToday === 0
                  ? 'No tasks scheduled yet today.'
                  : 'All scheduled tasks completed for today! 🎉'}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/daily-planner')}
            className="mt-4 flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-xs font-bold text-brand-700 transition-colors"
          >
            <span>Open Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Latest Meeting Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Latest Meeting</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {latestMeeting
                  ? new Date(latestMeeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'No meetings'}
              </span>
            </div>

            {latestMeeting ? (
              <div>
                <div className="text-sm font-bold text-slate-900 line-clamp-1">
                  {latestMeeting.title}
                </div>
                <div className="text-xs text-brand-700 font-semibold mt-1">
                  {latestMeeting.actionItems?.length || 0} action items detected
                  {latestMeeting.commitments?.length > 0 && ` • ${latestMeeting.commitments.length} follow-ups`}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-1">
                Paste meeting notes to extract actions and follow-ups.
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/meeting-intelligence')}
            className="mt-4 flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-xs font-bold text-brand-700 transition-colors"
          >
            <span>Review Meeting</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Productivity Insights Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between hover:shadow-md transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Productivity</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">Verified Data</span>
            </div>

            <div>
              <div className="text-sm font-bold text-slate-900">
                {productivitySummary?.kpis?.tasksCompleted || 0} tasks completed this week
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {productivitySummary?.kpis?.followUpCompletionRate || 0}% follow-up resolution rate
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/productivity-insights')}
            className="mt-4 flex items-center justify-between w-full px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-xs font-bold text-brand-700 transition-colors"
          >
            <span>View Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Main Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Focus Column: AI Prioritization & Context Recovery (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Task Prioritization Card */}
          <WhatToDoNowCard
            recommendation={recommendation}
            isLoading={loadingRecommendation}
            onRefresh={handleReevaluateAI}
          />

          {/* AI Context Recovery Banner */}
          <ContextRecoveryBanner
            session={activeSession}
            onSessionUpdated={loadDashboardData}
          />
        </div>

        {/* Right Action Column: AI Follow-up Extraction & Activities (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Natural Language Follow-up Detection */}
          <QuickCommitmentCard onFollowUpAdded={loadDashboardData} />

          {/* Recent Activity Live Stream */}
          <RecentActivityFeed activities={activities} isLoading={loadingActivities} />
        </div>
      </div>
    </div>
  );
};
