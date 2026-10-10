import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface StatCardProps {
  urgent: number;
  today: number;
  later: number;
  completed: number;
}

export const StatCard: React.FC<StatCardProps> = ({ urgent, today, later, completed }) => {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Urgent',
      count: urgent,
      filter: 'all',
      description: 'Require immediate focus',
      bgColor: 'bg-white hover:bg-red-50/30',
      borderColor: 'border-red-200 hover:border-red-300',
      textColor: 'text-red-600',
      countColor: 'text-slate-900',
      iconBg: 'bg-red-100/80 text-red-600',
      icon: AlertCircle,
    },
    {
      label: 'Due Today',
      count: today,
      filter: 'today',
      description: 'Scheduled before EOD',
      bgColor: 'bg-white hover:bg-purple-50/30',
      borderColor: 'border-purple-200 hover:border-purple-300',
      textColor: 'text-purple-600',
      countColor: 'text-slate-900',
      iconBg: 'bg-purple-100/80 text-purple-600',
      icon: Calendar,
    },
    {
      label: 'Upcoming Later',
      count: later,
      filter: 'upcoming',
      description: 'Future commitments',
      bgColor: 'bg-white hover:bg-blue-50/30',
      borderColor: 'border-blue-200 hover:border-blue-300',
      textColor: 'text-blue-600',
      countColor: 'text-slate-900',
      iconBg: 'bg-blue-100/80 text-blue-600',
      icon: Clock,
    },
    {
      label: 'Completed',
      count: completed,
      filter: 'completed',
      description: 'Finished tasks',
      bgColor: 'bg-white hover:bg-emerald-50/30',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
      textColor: 'text-emerald-600',
      countColor: 'text-slate-900',
      iconBg: 'bg-emerald-100/80 text-emerald-600',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            onClick={() => navigate(`/tasks?filter=${item.filter}`)}
            className={`p-5 rounded-2xl border ${item.borderColor} ${item.bgColor} cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg group shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${item.textColor}`}>
                {item.label}
              </span>
              <div className={`p-1.5 rounded-lg ${item.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <div className={`text-3xl font-extrabold tracking-tight ${item.countColor}`}>
                {item.count}
              </div>
              <div className="flex items-center text-xs font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">
                <span>View</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-1 font-medium">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
