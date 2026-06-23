// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TestsPage from './pages/TestsPage';
import TakeTestPage from './pages/TakeTestPage';
import AdminPanel from './pages/AdminPanel';
import PsychPanel from './pages/PsychPanel';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import SetupNicknamePage from './pages/SetupNicknamePage';
import SetupPage from './pages/SetupPage';
import NotFound from './pages/NotFound';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  if (user.firstLogin && !user.nickname) return <Navigate to="/setup-nickname" replace />;
  return children;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white/70 font-display text-lg">Загрузка...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/setup-nickname" element={<SetupNicknamePage />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/tests" element={<PrivateRoute><TestsPage /></PrivateRoute>} />
      <Route path="/tests/:testId" element={<PrivateRoute><TakeTestPage /></PrivateRoute>} />
      <Route path="/results/:testId" element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
      <Route path="/psychologist" element={<PrivateRoute roles={['psychologist', 'admin']}><PsychPanel /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/psytest">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
