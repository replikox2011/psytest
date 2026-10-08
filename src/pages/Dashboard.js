// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getAllTests, getResponsesByUser, getUsersByRole, getAllUsers } from '../firebase/services';
import {
  ClipboardList, CheckCircle2, Clock, Users, Brain, Shield,
  ArrowRight, TrendingUp, BookOpen, Star, Zap
} from 'lucide-react';

const ROLE_WELCOME = {
  admin: 'Панель администратора', psychologist: 'Рабочий стол психолога',
  director: 'Обзор директора', deputy: 'Рабочий стол завуча',
  teacher: 'Кабинет учителя', class_teacher: 'Кабинет классного руководителя',
  student: 'Мой кабинет'
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tests: 0, completed: 0, pending: 0, users: 0 });
  const [availableTests, setAvailableTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [allTests, myResponses] = await Promise.all([
          getAllTests(),
          getResponsesByUser(user.id),
        ]);

        const targetRole = user.role === 'student' ? 'student' : 'teacher';
        const relevant = allTests.filter(t => t.targetRole === targetRole && t.status === 'active');
        const completedIds = new Set(myResponses.map(r => r.testId));
        const pending = relevant.filter(t => !completedIds.has(t.id));

        let usersCount = 0;
        if (['admin', 'psychologist', 'director', 'deputy'].includes(user.role)) {
          const users = await getAllUsers();
          usersCount = users.length;
        }

        setAvailableTests(pending.slice(0, 3));
        setStats({ tests: relevant.length, completed: completedIds.size, pending: pending.length, users: usersCount });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const StatCard = ({ icon: Icon, label, value, color, sublabel }) => (
    <div className="stat-card group">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-display font-bold text-white">{value}</p>
      <p className="text-white/60 text-sm mt-1">{label}</p>
      {sublabel && <p className="text-white/40 text-xs mt-0.5">{sublabel}</p>}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Welcome */}
        <div className="glass rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-indigo-300 text-sm font-medium mb-1">
                  {new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })}
                </p>
                <h1 className="text-3xl font-display font-bold text-white mb-2">
                  Привет, {user?.fullName?.split(' ')[1] || user?.fullName}! 👋
                </h1>
                <p className="text-white/60">{ROLE_WELCOME[user?.role]}</p>
                {user?.role === 'student' && user?.className && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-indigo-500/20 rounded-full px-3 py-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="text-indigo-300 text-sm">{user.className}</span>
                  </div>
                )}
              </div>
              {stats.pending > 0 && (
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 text-center">
                  <Zap className="w-8 h-8 text-amber-400 mx-auto mb-1" />
                  <p className="text-amber-300 font-semibold text-sm">{stats.pending} тест(ов)</p>
                  <p className="text-amber-400/70 text-xs">ожидает вас</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="Тестов доступно" value={loading ? '—' : stats.tests} color="from-indigo-500 to-indigo-600" />
          <StatCard icon={CheckCircle2} label="Пройдено" value={loading ? '—' : stats.completed} color="from-emerald-500 to-teal-600" />
          <StatCard icon={Clock} label="Ожидает" value={loading ? '—' : stats.pending} color="from-amber-500 to-orange-600" />
          {['admin','psychologist','director','deputy'].includes(user?.role)
            ? <StatCard icon={Users} label="Пользователей" value={loading ? '—' : stats.users} color="from-purple-500 to-pink-600" />
            : <StatCard icon={Star} label="Активность" value="100%" color="from-cyan-500 to-blue-600" sublabel="Всё хорошо!" />
          }
        </div>

        {/* Pending tests */}
        {availableTests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-white">Ожидают прохождения</h2>
              <Link to="/tests" className="text-indigo-300 hover:text-indigo-200 text-sm flex items-center gap-1 transition-colors">
                Все тесты <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableTests.map(test => (
                <Link key={test.id} to={`/tests/${test.id}`}
                  className="glass rounded-2xl p-5 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 group border border-white/10 hover:border-indigo-400/40 block">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-indigo-300" />
                    </div>
                    <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Активен</span>
                  </div>
                  <h3 className="text-white font-semibold mb-1 group-hover:text-indigo-200 transition-colors">{test.title}</h3>
                  <p className="text-white/50 text-sm line-clamp-2">{test.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    {test.category && <span className="text-xs text-white/40">{test.category}</span>}
                    <span className="text-indigo-300 text-sm font-medium flex items-center gap-1 ml-auto">
                      Начать <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Admin quick actions */}
        {user?.role === 'admin' && (
          <div>
            <h2 className="text-xl font-display font-bold text-white mb-4">Быстрые действия</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/admin" className="glass rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 group border border-white/10 hover:border-indigo-400/40 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-indigo-200 transition-colors">Управление системой</h3>
                  <p className="text-white/50 text-sm">Пользователи, классы, настройки</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/psychologist" className="glass rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 group border border-white/10 hover:border-purple-400/40 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-purple-200 transition-colors">Психологическая панель</h3>
                  <p className="text-white/50 text-sm">Тесты, аналитика, ответы</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white/40 ml-auto group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {availableTests.length === 0 && !loading && (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-white font-display font-bold text-xl mb-2">Всё готово!</h3>
            <p className="text-white/50">Нет новых тестов для прохождения</p>
            <Link to="/tests" className="inline-flex items-center gap-2 mt-4 text-indigo-300 hover:text-indigo-200 transition-colors">
              Посмотреть все тесты <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
