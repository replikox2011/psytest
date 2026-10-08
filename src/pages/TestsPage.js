// src/pages/TestsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getAllTests, getResponsesByUser } from '../firebase/services';
import { ClipboardList, CheckCircle2, Lock, Clock, Search, Filter, ChevronRight, AlertCircle } from 'lucide-react';

const STATUS_BADGE = {
  active: { label: 'Активен', cls: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  draft: { label: 'Черновик', cls: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
  closed: { label: 'Закрыт', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

export default function TestsPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [allTests, responses] = await Promise.all([
          getAllTests(),
          getResponsesByUser(user.id)
        ]);
        const targetRole = user.role === 'student' ? 'student' : 'teacher';
        // Admins and psychologists see all
        const relevant = ['admin', 'psychologist', 'director', 'deputy'].includes(user.role)
          ? allTests
          : allTests.filter(t => t.targetRole === targetRole);
        setTests(relevant);
        setCompletedIds(new Set(responses.map(r => r.testId)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const filtered = tests.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'pending') return matchSearch && !completedIds.has(t.id) && t.status === 'active';
    if (filter === 'done') return matchSearch && completedIds.has(t.id);
    if (filter === 'active') return matchSearch && t.status === 'active';
    return matchSearch;
  });

  const canTake = (test) => {
    if (test.status !== 'active') return false;
    if (completedIds.has(test.id)) return false;
    const now = new Date();
    if (test.startDate && new Date(test.startDate) > now) return false;
    if (test.endDate && new Date(test.endDate) < now) return false;
    return true;
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Тесты</h1>
            <p className="text-white/50 mt-1">{tests.length} тестов найдено</p>
          </div>
        </div>

        {/* Search & filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск тестов..." className="input-field pl-11 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all','active','pending','done'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'glass text-white/60 hover:text-white hover:bg-white/15'
                }`}>
                {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : f === 'pending' ? 'Не пройдены' : 'Пройдены'}
              </button>
            ))}
          </div>
        </div>

        {/* Tests grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                <div className="h-3 bg-white/10 rounded mb-2 w-full" />
                <div className="h-3 bg-white/10 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">Тесты не найдены</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map(test => {
              const done = completedIds.has(test.id);
              const takeable = canTake(test);
              const status = STATUS_BADGE[test.status] || STATUS_BADGE.draft;

              return (
                <div key={test.id}
                  className={`glass rounded-2xl p-6 border border-white/10 transition-all duration-300 ${
                    takeable ? 'hover:bg-white/15 hover:-translate-y-1 hover:border-indigo-400/40 cursor-pointer' :
                    done ? 'opacity-80' : 'opacity-60'
                  }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      done ? 'bg-emerald-500/20 border border-emerald-500/30' :
                      takeable ? 'bg-indigo-500/20 border border-indigo-400/30' :
                      'bg-gray-500/20 border border-gray-500/30'
                    }`}>
                      {done ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                       takeable ? <ClipboardList className="w-5 h-5 text-indigo-300" /> :
                       <Lock className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                      {test.anonymity === 'anonymous' && (
                        <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30">Анонимно</span>
                      )}
                      {done && <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Пройден</span>}
                    </div>
                  </div>

                  <h3 className="text-white font-semibold text-lg mb-2">{test.title}</h3>
                  {test.description && <p className="text-white/50 text-sm mb-4 line-clamp-2">{test.description}</p>}

                  <div className="flex items-center gap-3 flex-wrap text-xs text-white/40 mb-4">
                    {test.category && <span className="flex items-center gap-1"><Filter className="w-3 h-3" />{test.category}</span>}
                    {test.targetRole && <span>{test.targetRole === 'student' ? 'Для учеников' : 'Для учителей'}</span>}
                    {test.endDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />до {new Date(test.endDate).toLocaleDateString('ru-RU')}</span>}
                  </div>

                  <div className="flex gap-2">
                    {takeable && (
                      <Link to={`/tests/${test.id}`} className="flex-1 btn-primary text-center text-sm py-2.5 flex items-center justify-center gap-1.5">
                        Пройти <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                    {done && (
                      <Link to={`/results/${test.id}`} className="flex-1 btn-secondary text-center text-sm py-2.5 flex items-center justify-center gap-1.5">
                        Мои ответы <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                    {!takeable && !done && (
                      <span className="flex-1 text-center text-white/30 text-sm py-2.5">Недоступен</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
