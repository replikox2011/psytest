// src/pages/ProfilePage.js
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { changeUserPassword, updateUser } from '../firebase/services';
import { User, Key, Check, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';

const ROLE_LABELS = {
  admin:'Администратор', psychologist:'Психолог', director:'Директор',
  deputy:'Завуч', teacher:'Учитель', class_teacher:'Кл. руководитель', student:'Ученик'
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (!newPass || newPass.length < 4) { setError('Пароль должен быть не менее 4 символов'); return; }
    if (newPass !== confirmPass) { setError('Пароли не совпадают'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await changeUserPassword(user.id, newPass);
      setSuccess('Пароль успешно изменён!');
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold text-white">Профиль</h1>

        {/* User info card */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
              {user?.fullName?.[0] || 'U'}
            </div>
            <div>
              <h2 className="text-white font-display font-bold text-2xl">{user?.fullName}</h2>
              <p className="text-white/50">@{user?.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Shield className="w-3 h-3 mr-1" />{ROLE_LABELS[user?.role]}
                </span>
                {user?.className && (
                  <span className="badge bg-purple-500/20 text-purple-300 border border-purple-500/30">{user.className}</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['UID', user?.uid],
              ['Никнейм', user?.nickname || '—'],
              ['Роль', ROLE_LABELS[user?.role]],
              ['Класс', user?.className || '—'],
            ].map(([label, val]) => (
              <div key={label} className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="text-white font-medium text-sm font-mono">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-display font-semibold text-lg mb-5 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" /> Сменить пароль
          </h3>
          <form onSubmit={handleChangePass} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Новый пароль</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                  className="input-field pr-10" placeholder="Минимум 4 символа" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Подтвердите пароль</label>
              <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                className="input-field" placeholder="Повторите пароль" />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 text-emerald-400" />
                <p className="text-emerald-300 text-sm">{success}</p>
              </div>
            )}
            <button type="submit" disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Key className="w-4 h-4" />}
              Сменить пароль
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
