// src/pages/SetupNicknamePage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUser, checkUsernameExists } from '../firebase/services';
import { generateNicknameSuggestions } from '../utils/crypto';
import { Sparkles, Check, AlertCircle, User } from 'lucide-react';

export default function SetupNicknamePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const suggestions = user?.fullName ? generateNicknameSuggestions(user.fullName) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = nickname.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) { setError('Никнейм должен быть не менее 3 символов'); return; }
    if (!/^[a-zа-яёa-z0-9_.-]+$/i.test(trimmed)) { setError('Только буквы, цифры, . _ -'); return; }
    setSaving(true); setError('');
    try {
      await updateUser(user.id, { nickname: trimmed, firstLogin: false });
      await refreshUser();
      navigate('/dashboard');
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600 rounded-full blur-3xl opacity-15" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl mb-5">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Добро пожаловать!</h1>
          <p className="text-white/60">{user?.fullName}</p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-xl font-display font-semibold text-white mb-2">Выберите никнейм</h2>
          <p className="text-white/50 text-sm mb-6">Это ваше имя в системе. Его видят другие пользователи.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value.toLowerCase())}
                className="input-field pl-11" placeholder="your_nickname" />
            </div>

            {suggestions.length > 0 && (
              <div>
                <p className="text-white/40 text-xs mb-2">Предложения:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => (
                    <button key={s} type="button" onClick={() => setNickname(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                        nickname === s
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-white/20 text-white/60 hover:border-indigo-400 hover:text-white'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button type="submit" disabled={saving || !nickname.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
              Продолжить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
