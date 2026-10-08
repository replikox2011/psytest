// src/pages/SetupPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import { Shield, CheckCircle2, AlertCircle, Loader, School } from 'lucide-react';

const GRADES = ['5','6','7','8','9','10','11'];
const LETTERS = ['А','Б','С'];

const ALL_CLASSES = GRADES.flatMap(g => LETTERS.map(l => ({ name: `${g}${l}`, grade: g, letter: l })));

export default function SetupPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  useEffect(() => { checkIfSetupNeeded(); }, []);

  const checkIfSetupNeeded = async () => {
    try {
      const [usersSnap, classesSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'classes')),
      ]);
      // Если юзеры есть но классов нет — нужно создать классы
      if (!usersSnap.empty && classesSnap.empty) {
        setStatus('needsClasses');
      } else if (!usersSnap.empty && !classesSnap.empty) {
        setStatus('exists');
      } else {
        setStatus('ready');
      }
    } catch (e) {
      setError('Ошибка подключения к Firebase: ' + e.message);
      setStatus('error');
    }
  };

  const createClassesOnly = async () => {
    setStatus('creating');
    try {
      setProgress('Создание классов...');
      for (const cls of ALL_CLASSES) {
        await addDoc(collection(db, 'classes'), {
          name: cls.name, grade: cls.grade, letter: cls.letter,
          maxStudents: 24,
          createdAt: serverTimestamp(),
        });
      }
      setProgress('Готово!');
      setStatus('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  const runSetup = async () => {
    setStatus('creating');
    try {
      // 1. Создаём классы
      setProgress('Создание классов...');
      for (const cls of ALL_CLASSES) {
        await addDoc(collection(db, 'classes'), {
          name: cls.name, grade: cls.grade, letter: cls.letter,
          maxStudents: 24,
          createdAt: serverTimestamp(),
        });
      }

      // 2. Создаём admin аккаунт
      setProgress('Создание аккаунта администратора...');
      const salt = 'xorazmiy_salt_2024';
      const passwordHash = sha256('2062323100294@nodirbek.h' + salt);
      await addDoc(collection(db, 'users'), {
        fullName: 'Нодирбек Камалов Хамза угли',
        username: 'mrrepl',
        nickname: 'mrrepl',
        email: 'mrreplik2011@gmail.com',
        role: 'admin',
        uid: 'UID-ADMIN001',
        salt, passwordHash,
        firstLogin: false,
        createdAt: serverTimestamp(),
      });

      setProgress('Готово!');
      setStatus('done');
      setTimeout(() => navigate('/login'), 2500);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600 rounded-full blur-3xl opacity-15" />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-2xl mb-5">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Первый запуск</h1>
          <p className="text-white/50 text-sm">Инициализация системы PsychSystem</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">

          {status === 'checking' && (
            <div className="text-center py-4">
              <Loader className="w-10 h-10 text-indigo-300 animate-spin mx-auto mb-4" />
              <p className="text-white/70">Проверка базы данных...</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-6">
              <p className="text-white/70 text-sm text-center">Будет создано следующее:</p>

              {/* Admin info */}
              <div className="space-y-2">
                <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">Аккаунт администратора</p>
                <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                  {[
                    ['ФИО', 'Нодирбек Камалов Хамза угли'],
                    ['Логин', 'mrrepl'],
                    ['Роль', 'Администратор'],
                    ['Пароль', '••••••••••••••'],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-white/40 text-sm">{l}</span>
                      <span className="text-white text-sm font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classes info */}
              <div className="space-y-2">
                <p className="text-white/50 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
                  <School className="w-3.5 h-3.5" /> Классы ({ALL_CLASSES.length} шт, макс. 24 ученика)
                </p>
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex flex-wrap gap-2">
                    {ALL_CLASSES.map(c => (
                      <span key={c.name} className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-1">
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/30 text-xs mt-3">5А–11С · 7 параллелей × 3 буквы = 21 класс</p>
                </div>
              </div>

              <button onClick={runSetup}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Запустить инициализацию
              </button>
            </div>
          )}

          {status === 'creating' && (
            <div className="text-center py-6 space-y-4">
              <Loader className="w-12 h-12 text-purple-300 animate-spin mx-auto" />
              <div>
                <p className="text-white font-semibold">Настройка системы...</p>
                <p className="text-white/50 text-sm mt-1">{progress}</p>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-display font-bold text-xl mb-1">Система готова!</h3>
                <p className="text-white/50 text-sm">Создано 21 класс и аккаунт администратора</p>
                <p className="text-white/30 text-xs mt-1">Переход на страницу входа...</p>
              </div>
            </div>
          )}

          {status === 'needsClasses' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 bg-amber-500/20 border border-amber-500/30 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-medium text-sm">Классы не созданы</p>
                  <p className="text-amber-400/70 text-xs mt-1">Аккаунт админа уже есть, но классы отсутствуют в базе</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <div className="flex flex-wrap gap-2">
                  {ALL_CLASSES.map(c => (
                    <span key={c.name} className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-1">
                      {c.name}
                    </span>
                  ))}
                </div>
                <p className="text-white/30 text-xs mt-3">21 класс · макс. 24 ученика каждый</p>
              </div>
              <button onClick={createClassesOnly}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <School className="w-5 h-5" />
                Создать все классы
              </button>
            </div>
          )}

          {status === 'exists' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Уже настроено</h3>
                <p className="text-white/50 text-sm">Система была инициализирована ранее</p>
              </div>
              <button onClick={() => navigate('/login')} className="w-full btn-primary">
                Перейти ко входу
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-medium text-sm">Ошибка</p>
                  <p className="text-red-400/70 text-xs mt-1">{error}</p>
                </div>
              </div>
              <button onClick={checkIfSetupNeeded} className="w-full btn-secondary text-sm py-2.5">
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
