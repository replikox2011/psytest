// src/pages/TakeTestPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  getTestById, getQuestionsByTest, hasUserCompletedTest, submitResponse
} from '../firebase/services';
import {
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Brain
} from 'lucide-react';

export default function TakeTestPage() {
  const { testId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, qs, completed] = await Promise.all([
          getTestById(testId),
          getQuestionsByTest(testId),
          hasUserCompletedTest(user.id, testId),
        ]);
        if (!t) { navigate('/tests'); return; }
        if (completed) { setAlreadyDone(true); setLoading(false); return; }
        setTest(t);
        setQuestions(qs);
        const init = {};
        qs.forEach(q => { init[q.id] = ''; });
        setAnswers(init);
      } catch (e) { setError('Ошибка загрузки теста'); }
      finally { setLoading(false); }
    };
    load();
  }, [testId, user.id]);

  const q = questions[current];
  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;
  const allAnswered = questions.every(q => answers[q.id]?.toString().trim() !== '');

  const handleAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));

  const handleSubmit = async () => {
    if (!allAnswered) { setError('Пожалуйста, ответьте на все вопросы'); return; }
    setSubmitting(true);
    setError('');
    try {
      await submitResponse({
        testId, userId: user.id, userFullName: test.anonymity === 'anonymous' ? null : user.fullName,
        classId: user.classId, className: user.className,
        answers,
        isAnonymous: test.anonymity === 'anonymous',
      });
      setDone(true);
    } catch (e) { setError('Ошибка отправки. Попробуйте снова'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-64">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (alreadyDone) return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-12 text-center border border-amber-500/20">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-white mb-2">Тест уже пройден</h2>
          <p className="text-white/60 mb-6">Каждый тест можно пройти только один раз</p>
          <button onClick={() => navigate('/tests')} className="btn-primary">← Назад к тестам</button>
        </div>
      </div>
    </Layout>
  );

  if (done) return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-3xl p-12 text-center border border-emerald-500/20">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-3">Тест завершён!</h2>
          <p className="text-white/60 mb-2">Ваши ответы успешно отправлены</p>
          <p className="text-white/40 text-sm mb-8">{test?.title}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/tests')} className="btn-primary">← К тестам</button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Главная</button>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!test || questions.length === 0) return (
    <Layout>
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-white/50">В тесте нет вопросов</p>
        <button onClick={() => navigate('/tests')} className="btn-secondary mt-4">← Назад</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="glass rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-display font-bold truncate">{test.title}</h1>
              <p className="text-white/50 text-xs">{test.category || 'Без категории'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-white font-bold text-lg">{current + 1}/{questions.length}</p>
              <p className="text-white/40 text-xs">вопросов</p>
            </div>
          </div>
          {/* Progress */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question */}
        <div className="glass rounded-2xl p-8 border border-white/10 min-h-64">
          <p className="text-white/50 text-sm mb-3">Вопрос {current + 1}</p>
          <h2 className="text-white font-semibold text-xl mb-8 leading-relaxed">{q.text}</h2>

          {q.type === 'yes_no' && (
            <div className="flex gap-4">
              {['Да', 'Нет'].map(opt => (
                <button key={opt} onClick={() => handleAnswer(q.id, opt)}
                  className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-200 border-2 ${
                    answers[q.id] === opt
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'border-white/20 text-white/70 hover:border-indigo-400 hover:text-white hover:bg-white/10'
                  }`}>{opt}</button>
              ))}
            </div>
          )}

          {q.type === 'choice' && q.options && (
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(q.id, opt)}
                  className={`w-full text-left py-4 px-5 rounded-xl transition-all duration-200 border-2 font-medium ${
                    answers[q.id] === opt
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'border-white/20 text-white/70 hover:border-indigo-400 hover:text-white hover:bg-white/10'
                  }`}>
                  <span className="mr-3 opacity-60">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'free' && (
            <textarea value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)}
              rows={5} placeholder="Введите ваш ответ..."
              className="input-field resize-none text-sm leading-relaxed" />
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={() => { setCurrent(c => c - 1); setError(''); }} disabled={current === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl glass text-white/70 hover:text-white hover:bg-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-white/10">
            <ChevronLeft className="w-5 h-5" /> Назад
          </button>

          <div className="flex-1 flex justify-center items-center gap-1.5">
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === current ? 'bg-indigo-400 w-6' :
                  answers[questions[i].id] ? 'bg-emerald-400/70' : 'bg-white/20'
                }`} />
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button onClick={() => { setCurrent(c => c + 1); setError(''); }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/30">
              Далее <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting || !allAnswered}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Завершить
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
