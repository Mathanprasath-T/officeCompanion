import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0f14] text-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl btn-grad flex items-center justify-center text-[#0b0f14] shadow-lg animate-pulse">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            OfficeCompanion
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
          <span>Verifying secure authenticated session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
