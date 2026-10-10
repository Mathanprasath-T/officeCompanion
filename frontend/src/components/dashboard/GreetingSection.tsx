import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const GreetingSection: React.FC = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>
            {getGreeting()}, {user?.name || 'there'}
          </span>
          <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          OfficeCompanion prioritized your workload. Let's tackle what matters most.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold">
        <Calendar className="w-4 h-4 text-brand-600" />
        <span>{todayStr}</span>
      </div>
    </div>
  );
};
