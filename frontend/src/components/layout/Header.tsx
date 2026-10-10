import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  Menu,
  Sparkles,
  Check,
  CheckCheck,
  Search,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Activity as ActivityIcon,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      showToast('Could not mark notification as read.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark all as read.', 'error');
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      api.notifications.markRead(notification._id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsNotifOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    showToast('Signed out of OfficeCompanion successfully.', 'info');
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 bg-[#0d121c]/90 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 text-slate-200">
      {/* Left: Mobile Menu & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-white/[0.06] transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, follow-ups or context..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-all shadow-xs"
          />
        </form>
      </div>

      {/* Right: AI Badge, Notification Bell & User Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* AI System Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>AI Engines Active</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setIsProfileOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all duration-150 relative active:scale-95 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-teal-400 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-[#0d121c] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Menu */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f1523] rounded-2xl shadow-2xl border border-white/[0.12] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center text-slate-500 text-xs">
                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-500" />
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 text-left cursor-pointer transition-colors hover:bg-white/[0.04] flex items-start gap-3 ${
                        !n.read ? 'bg-teal-500/[0.06]' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !n.read ? 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-semibold text-xs text-slate-200 truncate">{n.title}</span>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>

                      {!n.read && (
                        <button
                          onClick={(e) => handleMarkRead(n._id, e)}
                          title="Mark read"
                          className="p-1 text-slate-400 hover:text-teal-300 rounded transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/[0.10] hidden sm:block" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-white/[0.06] transition-all duration-150 border border-transparent hover:border-white/[0.10] text-left active:scale-[0.98] cursor-pointer"
            aria-label="User profile menu"
          >
            {/* Avatar or Initial */}
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User'}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-teal-400/40"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-fuchsia-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                {userInitial}
              </div>
            )}

            <div className="hidden md:block">
              <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                {user?.name || 'User'}
              </div>
              <div className="text-[10px] text-teal-400 leading-none truncate max-w-[120px]">
                {user?.role || 'Team Lead'}
              </div>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180 text-teal-400' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0f1523] rounded-2xl shadow-2xl border border-white/[0.12] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
              {/* User Snapshot Header */}
              <div className="p-4 border-b border-white/[0.08] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-400/30"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-fuchsia-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
                      {userInitial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{user?.email}</div>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-[10px] font-semibold">
                      <span>{user?.role || 'Team Lead'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-2 space-y-1 text-xs">
                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile & Account</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <span>Settings & Preferences</span>
                </Link>

                <Link
                  to="/activity"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors"
                >
                  <ActivityIcon className="w-4 h-4 text-slate-400" />
                  <span>Activity History</span>
                </Link>
              </div>

              {/* Logout Action */}
              <div className="p-2 border-t border-white/[0.08] bg-white/[0.01]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
