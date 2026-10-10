import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Compass,
  Clock,
  CalendarDays,
  FileText,
  TrendingUp,
  Activity as ActivityIcon,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Context Recovery', path: '/context', icon: Compass },
        { label: 'Follow-ups', path: '/followups', icon: Clock },
      ],
    },
    {
      title: 'PRODUCTIVITY',
      items: [
        { label: 'Daily Planner', path: '/daily-planner', icon: CalendarDays },
        { label: 'Meeting Intelligence', path: '/meeting-intelligence', icon: FileText },
        { label: 'Productivity Insights', path: '/productivity-insights', icon: TrendingUp },
      ],
    },
    {
      title: 'OTHER',
      items: [
        { label: 'Activity', path: '/activity', icon: ActivityIcon },
        { label: 'Settings', path: '/settings', icon: SettingsIcon },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0d121c] border-r border-white/[0.08] flex flex-col h-full select-none text-slate-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl btn-grad flex items-center justify-center text-[#0b0f14] shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white tracking-tight block">OfficeCompanion</span>
            <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest block -mt-1">
              AI Workplace
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/30 shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 text-teal-400" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0b0f17]">
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-500 to-fuchsia-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-100 truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.role || 'Team Lead'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
