// src/pages/ResultsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { getTestById, getUserResponseForTest, getQuestionsByTest } from '../firebase/services';
import { CheckCircle2, ArrowLeft, ClipboardList } from 'lucide-react';

export default function ResultsPage() {
  const { testId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [response, setResponse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [t, r, qs] = await Promise.all([
        getTestById(testId),
        getUserResponseForTest(user.id, testId),
        getQuestionsByTest(testId),
      ]);
      setTest(t); setResponse(r); setQuestions(qs);
      setLoading(false);
    };
    load();
  }, [testId, user.id]);

  if (loading) return <Layout><div className="flex items-center justify-center min-h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div></Layout>;

  if (!response) return <Layout>
    <div className="max-w-2xl mx-auto glass rounded-2xl p-8 text-center">
      <p className="text-white/50">Ответы не найдены</p>
      <button onClick={() => navigate('/tests')} className="btn-secondary mt-4">← Тесты</button>
    </div>
  </Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tests')} className="text-white/60 hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <h1 className="text-2xl font-display font-bold text-white">{test?.title}</h1>
        </div>
        <div className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-white font-semibold">Тест пройден</p>
            <p className="text-white/50 text-sm">
              {response.submittedAt?.toDate ? response.submittedAt.toDate().toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) : ''}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="glass rounded-2xl p-5 border border-white/10">
              <p className="text-white/50 text-xs mb-1">Вопрос {i+1}</p>
              <p className="text-white font-medium mb-3">{q.text}</p>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2.5">
                <p className="text-indigo-200 text-sm">{response.answers?.[q.id] || <span className="text-white/30 italic">Нет ответа</span>}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
