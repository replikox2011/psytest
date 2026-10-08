// src/pages/PsychPanel.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllTests, createTest, updateTest, deleteTest, getTestById,
  addQuestion, getQuestionsByTest, deleteQuestion, updateQuestion,
  getAllClasses, getResponsesByTest, getResponsesByTestAndClass,
  getUsersByClass
} from '../firebase/services';
import {
  Brain, Plus, Trash2, Edit2, X, Check, AlertCircle, BarChart2,
  ChevronDown, ChevronUp, Eye, EyeOff, Settings, FileText, Users,
  ArrowLeft, ClipboardList, Filter
} from 'lucide-react';

const STATUS_COLORS = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  closed: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const STATUS_LABELS = { draft: 'Черновик', active: 'Активен', closed: 'Закрыт' };

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} glass rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-display font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PsychPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Test form
  const [showTestModal, setShowTestModal] = useState(false);
  const [editTest, setEditTest] = useState(null);
  const [testForm, setTestForm] = useState({
    title:'', description:'', category:'', targetRole:'student',
    anonymity:'open', status:'draft', startDate:'', endDate:''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Questions
  const [showQModal, setShowQModal] = useState(null); // testId
  const [questions, setQuestions] = useState([]);
  const [qForm, setQForm] = useState({ text:'', type:'yes_no', options:['',''], order: 0 });
  const [editQ, setEditQ] = useState(null);

  // Results
  const [showResults, setShowResults] = useState(null); // test object
  const [selectedClass, setSelectedClass] = useState('');
  const [responses, setResponses] = useState([]);
  const [students, setStudents] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const loadTests = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([getAllTests(), getAllClasses()]);
      setTests(t);
      setClasses(c);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTests(); }, []);

  // Test CRUD
  const openCreateTest = () => {
    setTestForm({ title:'', description:'', category:'', targetRole:'student', anonymity:'open', status:'draft', startDate:'', endDate:'' });
    setEditTest(null); setFormError(''); setShowTestModal(true);
  };
  const openEditTest = (t) => {
    setTestForm({ title:t.title, description:t.description||'', category:t.category||'', targetRole:t.targetRole||'student', anonymity:t.anonymity||'open', status:t.status||'draft', startDate:t.startDate||'', endDate:t.endDate||'' });
    setEditTest(t); setFormError(''); setShowTestModal(true);
  };
  const handleSaveTest = async () => {
    if (!testForm.title.trim()) { setFormError('Укажите название'); return; }
    setSaving(true); setFormError('');
    try {
      if (editTest) {
        await updateTest(editTest.id, { ...testForm, updatedAt: new Date().toISOString() });
      } else {
        await createTest({ ...testForm, createdBy: user.id });
      }
      setShowTestModal(false);
      await loadTests();
    } catch(e) { setFormError(e.message); }
    finally { setSaving(false); }
  };
  const handleDeleteTest = async (id) => {
    if (!window.confirm('Удалить тест и все вопросы?')) return;
    await deleteTest(id); await loadTests();
  };
  const handleStatusChange = async (id, status) => {
    await updateTest(id, { status }); await loadTests();
  };

  // Questions
  const openQuestions = async (testId) => {
    setShowQModal(testId);
    const qs = await getQuestionsByTest(testId);
    setQuestions(qs);
    setQForm({ text:'', type:'yes_no', options:['',''], order: qs.length });
    setEditQ(null);
  };
  const handleSaveQ = async () => {
    if (!qForm.text.trim()) { setFormError('Введите текст вопроса'); return; }
    setSaving(true); setFormError('');
    try {
      const data = { ...qForm, options: qForm.type === 'choice' ? qForm.options.filter(o => o.trim()) : [] };
      if (editQ) {
        await updateQuestion(editQ.id, data);
      } else {
        await addQuestion(showQModal, data);
      }
      const qs = await getQuestionsByTest(showQModal);
      setQuestions(qs);
      setQForm({ text:'', type:'yes_no', options:['',''], order: qs.length });
      setEditQ(null);
    } catch(e) { setFormError(e.message); }
    finally { setSaving(false); }
  };
  const handleDeleteQ = async (qId) => {
    await deleteQuestion(qId);
    const qs = await getQuestionsByTest(showQModal);
    setQuestions(qs);
  };

  // Results
  const openResults = async (test) => {
    setShowResults(test);
    setSelectedClass('');
    setResponses([]);
    setStudents([]);
  };
  const loadResults = async () => {
    if (!showResults) return;
    setResultsLoading(true);
    try {
      let resp;
      if (selectedClass) {
        resp = await getResponsesByTestAndClass(showResults.id, selectedClass);
        const studs = await getUsersByClass(selectedClass);
        setStudents(studs);
      } else {
        resp = await getResponsesByTest(showResults.id);
      }
      setResponses(resp);
    } catch(e) { console.error(e); }
    finally { setResultsLoading(false); }
  };
  useEffect(() => { if (showResults) loadResults(); }, [selectedClass, showResults?.id]);

  const getStudentForResponse = (r) => {
    return students.find(s => s.id === r.userId);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" /> Психологическая панель
          </h1>
          <p className="text-white/50 mt-1">Создание тестов, управление вопросами и анализ результатов</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[['tests','📋 Тесты'],['results','📊 Результаты']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === t ? 'bg-purple-600 text-white shadow-lg' : 'glass text-white/60 hover:text-white'
              }`}>{l}</button>
          ))}
        </div>

        {/* TESTS TAB */}
        {tab === 'tests' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={openCreateTest} className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Создать тест
              </button>
            </div>
            {loading ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {tests.map(test => (
                  <div key={test.id} className="glass rounded-2xl border border-white/10 hover:bg-white/5 transition-all duration-200">
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">{test.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`badge border ${STATUS_COLORS[test.status]}`}>{STATUS_LABELS[test.status]}</span>
                          {test.category && <span className="text-white/40 text-xs">{test.category}</span>}
                          <span className="text-white/40 text-xs">{test.targetRole === 'student' ? '👤 Ученики' : '🎓 Учителя'}</span>
                          {test.anonymity === 'anonymous' && <span className="text-white/40 text-xs">🔒 Анонимно</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {/* Status quick change */}
                        <select value={test.status} onChange={e => handleStatusChange(test.id, e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-purple-400">
                          <option value="draft">Черновик</option>
                          <option value="active">Активен</option>
                          <option value="closed">Закрыт</option>
                        </select>
                        <button onClick={() => openQuestions(test.id)}
                          className="p-2 rounded-lg text-white/50 hover:text-cyan-300 hover:bg-cyan-500/20 transition-all" title="Вопросы">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setTab('results'); openResults(test); }}
                          className="p-2 rounded-lg text-white/50 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all" title="Результаты">
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditTest(test)}
                          className="p-2 rounded-lg text-white/50 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all" title="Редактировать">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTest(test.id)}
                          className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/20 transition-all" title="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {tests.length === 0 && (
                  <div className="glass rounded-2xl p-12 text-center">
                    <Brain className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Нет тестов. Создайте первый.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RESULTS TAB */}
        {tab === 'results' && (
          <div className="space-y-4">
            {!showResults ? (
              <div>
                <p className="text-white/60 mb-4">Выберите тест для просмотра результатов:</p>
                <div className="space-y-3">
                  {tests.map(test => (
                    <button key={test.id} onClick={() => openResults(test)}
                      className="w-full glass rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all duration-200 text-left flex items-center gap-4">
                      <BarChart2 className="w-5 h-5 text-purple-300 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">{test.title}</p>
                        <p className="text-white/40 text-sm">{STATUS_LABELS[test.status]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => setShowResults(null)} className="text-white/60 hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Назад
                  </button>
                  <h2 className="text-white font-display font-bold text-xl">{showResults.title}</h2>
                  <span className={`badge border ${STATUS_COLORS[showResults.status]}`}>{STATUS_LABELS[showResults.status]}</span>
                </div>

                {/* Class filter */}
                <div className="glass rounded-2xl p-4 border border-white/10 flex items-center gap-4 flex-wrap">
                  <Filter className="w-4 h-4 text-white/50" />
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                    className="input-field w-auto text-sm">
                    <option value="">Все классы</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="text-white/50 text-sm">{responses.length} ответов</span>
                </div>

                {resultsLoading ? (
                  <div className="glass rounded-2xl p-8 text-center">
                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                  </div>
                ) : responses.length === 0 ? (
                  <div className="glass rounded-2xl p-12 text-center">
                    <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40">Нет ответов для отображения</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {responses.map((resp, i) => {
                      const student = !resp.isAnonymous ? getStudentForResponse(resp) : null;
                      return (
                        <div key={resp.id} className="glass rounded-2xl p-5 border border-white/10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {resp.isAnonymous ? '?' : (resp.userFullName?.[0] || '?')}
                            </div>
                            <div>
                              {resp.isAnonymous
                                ? <p className="text-white/50 text-sm italic">Анонимный ответ</p>
                                : <p className="text-white font-medium">{resp.userFullName}</p>
                              }
                              <p className="text-white/40 text-xs">
                                {resp.className} · {resp.submittedAt?.toDate ? resp.submittedAt.toDate().toLocaleDateString('ru-RU') : 'Дата неизвестна'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(resp.answers || {}).map(([qId, answer]) => {
                              const question = questions.find ? undefined : undefined;
                              return (
                                <div key={qId} className="bg-white/5 rounded-xl p-3">
                                  <p className="text-white/50 text-xs mb-1 font-mono">Вопрос #{qId.slice(-4)}</p>
                                  <p className="text-white/90 text-sm">{answer || <span className="text-white/30 italic">Нет ответа</span>}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <Modal title={editTest ? 'Редактировать тест' : 'Новый тест'} onClose={() => setShowTestModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Название *</label>
              <input type="text" value={testForm.title} onChange={e => setTestForm(p => ({...p, title: e.target.value}))}
                className="input-field" placeholder="Тест на стресс..." />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Описание</label>
              <textarea value={testForm.description} onChange={e => setTestForm(p => ({...p, description: e.target.value}))}
                rows={3} className="input-field resize-none text-sm" placeholder="Описание теста..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Категория</label>
                <input type="text" value={testForm.category} onChange={e => setTestForm(p => ({...p, category: e.target.value}))}
                  className="input-field text-sm" placeholder="Адаптация, Тревожность..." />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Для кого</label>
                <select value={testForm.targetRole} onChange={e => setTestForm(p => ({...p, targetRole: e.target.value}))}
                  className="input-field text-sm">
                  <option value="student">Ученики</option>
                  <option value="teacher">Учителя</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Анонимность</label>
                <select value={testForm.anonymity} onChange={e => setTestForm(p => ({...p, anonymity: e.target.value}))}
                  className="input-field text-sm">
                  <option value="open">Открытый</option>
                  <option value="anonymous">Анонимный</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Статус</label>
                <select value={testForm.status} onChange={e => setTestForm(p => ({...p, status: e.target.value}))}
                  className="input-field text-sm">
                  <option value="draft">Черновик</option>
                  <option value="active">Активен</option>
                  <option value="closed">Закрыт</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Дата начала</label>
                <input type="date" value={testForm.startDate} onChange={e => setTestForm(p => ({...p, startDate: e.target.value}))}
                  className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Дата окончания</label>
                <input type="date" value={testForm.endDate} onChange={e => setTestForm(p => ({...p, endDate: e.target.value}))}
                  className="input-field text-sm" />
              </div>
            </div>
            {formError && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowTestModal(false)} className="flex-1 btn-secondary text-sm py-2.5">Отмена</button>
              <button onClick={handleSaveTest} disabled={saving} className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {editTest ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Questions Modal */}
      {showQModal && (
        <Modal title="Вопросы теста" wide onClose={() => { setShowQModal(null); setEditQ(null); }} >
          <div className="space-y-6">
            {/* Existing questions */}
            <div className="space-y-3">
              <h4 className="text-white/70 text-sm font-semibold">Вопросы ({questions.length})</h4>
              {questions.length === 0 && <p className="text-white/30 text-sm">Нет вопросов</p>}
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white/5 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-white/30 text-sm w-5 flex-shrink-0">{i+1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{q.text}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {q.type === 'yes_no' ? 'Да/Нет' : q.type === 'choice' ? `Выбор (${q.options?.length})` : 'Свободный'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditQ(q); setQForm({ text:q.text, type:q.type, options:q.options||['',''], order:q.order||i }); }}
                      className="p-1.5 rounded-lg text-white/40 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteQ(q.id)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add/Edit question form */}
            <div className="border-t border-white/10 pt-5 space-y-4">
              <h4 className="text-white/70 text-sm font-semibold">{editQ ? 'Редактировать вопрос' : 'Добавить вопрос'}</h4>
              <div>
                <label className="block text-white/70 text-xs mb-1.5">Текст вопроса</label>
                <textarea value={qForm.text} onChange={e => setQForm(p => ({...p, text: e.target.value}))}
                  rows={2} className="input-field resize-none text-sm" placeholder="Введите вопрос..." />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-1.5">Тип ответа</label>
                <select value={qForm.type} onChange={e => setQForm(p => ({...p, type: e.target.value, options:['','']}))}
                  className="input-field text-sm">
                  <option value="yes_no">Да / Нет</option>
                  <option value="choice">Выбор варианта</option>
                  <option value="free">Свободный ответ</option>
                </select>
              </div>
              {qForm.type === 'choice' && (
                <div className="space-y-2">
                  <label className="block text-white/70 text-xs">Варианты ответа</label>
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={opt} onChange={e => {
                        const opts = [...qForm.options];
                        opts[i] = e.target.value;
                        setQForm(p => ({...p, options: opts}));
                      }} className="input-field flex-1 text-sm" placeholder={`Вариант ${i+1}`} />
                      {qForm.options.length > 2 && (
                        <button onClick={() => setQForm(p => ({...p, options: p.options.filter((_,j) => j !== i)}))}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/20">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {qForm.options.length < 6 && (
                    <button onClick={() => setQForm(p => ({...p, options: [...p.options, '']}))}
                      className="text-indigo-300 text-sm hover:text-indigo-200 flex items-center gap-1 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Добавить вариант
                    </button>
                  )}
                </div>
              )}
              {formError && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-red-300 text-xs">{formError}</p>
                </div>
              )}
              <div className="flex gap-2">
                {editQ && (
                  <button onClick={() => { setEditQ(null); setQForm({ text:'', type:'yes_no', options:['',''], order:questions.length }); }}
                    className="btn-secondary text-sm py-2 px-4">Отмена</button>
                )}
                <button onClick={handleSaveQ} disabled={saving}
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editQ ? 'Сохранить' : 'Добавить вопрос'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
