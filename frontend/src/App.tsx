import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { TaskDetails } from './pages/TaskDetails';
import { ContextRecovery } from './pages/ContextRecovery';
import { FollowUps } from './pages/FollowUps';
import { DailyPlanner } from './pages/DailyPlanner';
import { MeetingIntelligence } from './pages/MeetingIntelligence';
import { ProductivityInsights } from './pages/ProductivityInsights';
import { ActivityPage } from './pages/Activity';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Workspace Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetails />} />
                <Route path="/context" element={<ContextRecovery />} />
                <Route path="/followups" element={<FollowUps />} />
                <Route path="/daily-planner" element={<DailyPlanner />} />
                <Route path="/meeting-intelligence" element={<MeetingIntelligence />} />
                <Route path="/productivity-insights" element={<ProductivityInsights />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Default & Catch-all Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
