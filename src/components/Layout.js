// src/components/Layout.js
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ClipboardList, Shield, Brain, User,
  LogOut, Menu, X, ChevronRight, Bell, Settings
} from 'lucide-react';

const ROLE_LABELS = {
  admin: 'Администратор', psychologist: 'Психолог', director: 'Директор',
  deputy: 'Завуч', teacher: 'Учитель', class_teacher: 'Кл. руководитель', student: 'Ученик'
};

const ROLE_COLORS = {
  admin: 'from-red-500 to-orange-500', psychologist: 'from-purple-500 to-indigo-500',
  director: 'from-blue-500 to-cyan-500', deputy: 'from-teal-500 to-green-500',
  teacher: 'from-yellow-500 to-amber-500', class_teacher: 'from-pink-500 to-rose-500',
  student: 'from-indigo-500 to-blue-500'
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
    { to: '/tests', icon: ClipboardList, label: 'Тесты' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Управление' }] : []),
    ...(['psychologist', 'admin'].includes(user?.role) ? [{ to: '/psychologist', icon: Brain, label: 'Аналитика' }] : []),
    { to: '/profile', icon: User, label: 'Профиль' },
  ];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Background orbs */}
      <div className="orb w-96 h-96 bg-indigo-600 top-0 left-0" />
      <div className="orb w-96 h-96 bg-purple-600 bottom-0 right-0" />
      <div className="orb w-64 h-64 bg-cyan-600 top-1/2 left-1/2" />

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col z-40">
        <div className="glass h-full flex flex-col border-r border-white/10">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-display font-bold text-sm leading-tight">PsychSystem</p>
                <p className="text-white/40 text-xs">Al-Xorazmiy</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROLE_COLORS[user?.role]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                {user?.fullName?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
                <p className="text-white/50 text-xs">{ROLE_LABELS[user?.role]}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname.startsWith(to);
              return (
                <Link key={to} to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{label}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200">
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-display font-bold text-sm">PsychSystem</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="text-white/70 hover:text-white p-1">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 glass border-r border-white/10 flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white font-display font-bold">Меню</span>
              <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROLE_COLORS[user?.role]} flex items-center justify-center text-white font-bold text-sm`}>
                  {user?.fullName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{user?.fullName}</p>
                  <p className="text-white/50 text-xs">{ROLE_LABELS[user?.role]}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active ? 'bg-indigo-600 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 transition-all">
                <LogOut className="w-5 h-5" />
                <span className="font-medium text-sm">Выйти</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 relative z-10">
        <div className="p-4 lg:p-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
