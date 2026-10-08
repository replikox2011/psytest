// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  getAllUsers, createUser, deleteUser, updateUser,
  getAllClasses, createClass, deleteClass,
  checkUsernameExists, changeUserPassword
} from '../firebase/services';
import {
  Users, Plus, Trash2, Edit2, Key, X, Check, School,
  Shield, ChevronDown, AlertCircle, Search, UserPlus
} from 'lucide-react';

const ROLES = ['admin','psychologist','director','deputy','teacher','class_teacher','student'];
const ROLE_LABELS = {
  admin:'Администратор', psychologist:'Психолог', director:'Директор',
  deputy:'Завуч', teacher:'Учитель', class_teacher:'Кл. руководитель', student:'Ученик'
};
const GRADES = ['5','6','7','8','9','10','11'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-3xl p-6 border border-white/20 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-display font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const [userForm, setUserForm] = useState({ fullName:'', username:'', password:'', role:'student', classId:'', className:'' });
  const [classForm, setClassForm] = useState({ name:'', grade:'5', letter:'А' });
  const [newPass, setNewPass] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [u, c] = await Promise.all([getAllUsers(), getAllClasses()]);
      setUsers(u);
      setClasses(c);
      console.log('Классы загружены:', c.length, c.map(x => x.name));
    } catch(e) {
      console.error('Ошибка загрузки:', e);
      alert('Ошибка загрузки данных: ' + e.message);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreateUser = () => {
    setUserForm({ fullName:'', username:'', password:'', role:'student', classId:'', className:'' });
    setEditUser(null); setFormError(''); setShowUserModal(true);
  };

  const openEditUser = (u) => {
    setUserForm({ fullName: u.fullName, username: u.username, password:'', role: u.role, classId: u.classId||'', className: u.className||'' });
    setEditUser(u); setFormError(''); setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.fullName.trim() || !userForm.username.trim()) { setFormError('Заполните обязательные поля'); return; }
    if (!editUser && !userForm.password) { setFormError('Укажите пароль'); return; }
    setSaving(true); setFormError('');
    try {
      if (editUser) {
        await updateUser(editUser.id, {
          fullName: userForm.fullName, role: userForm.role,
          classId: userForm.classId, className: userForm.className,
        });
      } else {
        const exists = await checkUsernameExists(userForm.username);
        if (exists) { setFormError('Это имя пользователя уже занято'); setSaving(false); return; }
        await createUser(userForm);
      }
      setShowUserModal(false);
      await load();
    } catch(e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    await deleteUser(userId); await load();
  };

  const handleChangePassword = async () => {
    if (!newPass || newPass.length < 4) { setFormError('Пароль должен быть не менее 4 символов'); return; }
    setSaving(true); setFormError('');
    try {
      await changeUserPassword(showPassModal.id, newPass);
      setShowPassModal(null); setNewPass('');
    } catch(e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleCreateClass = async () => {
    if (!classForm.grade || !classForm.letter) { setFormError('Заполните все поля'); return; }
    const name = `${classForm.grade}${classForm.letter}`;
    setSaving(true); setFormError('');
    try {
      await createClass({ name, grade: classForm.grade, letter: classForm.letter });
      setShowClassModal(false); await load();
    } catch(e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Удалить класс?')) return;
    await deleteClass(classId); await load();
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const selectedClass = classes.find(c => c.id === userForm.classId);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" /> Управление системой
            </h1>
            <p className="text-white/50 mt-1">Администратор — полный доступ</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[['users','👤 Пользователи'],['classes','🏫 Классы']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                tab === t ? 'bg-indigo-600 text-white shadow-lg' : 'glass text-white/60 hover:text-white'
              }`}>{l}</button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-48 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск..." className="input-field pl-11 text-sm" />
              </div>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                className="input-field w-auto text-sm">
                <option value="all">Все роли</option>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <button onClick={openCreateUser} className="btn-primary flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4" /> Добавить
              </button>
            </div>

            {loading ? (
              <div className="glass rounded-2xl p-8 text-center">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-white font-semibold">Пользователи ({filteredUsers.length})</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.fullName?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{u.fullName}</p>
                        <p className="text-white/40 text-xs">@{u.username} {u.className ? `· ${u.className}` : ''}</p>
                      </div>
                      <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden sm:inline-flex">
                        {ROLE_LABELS[u.role]}
                      </span>
                      <p className="text-white/40 text-xs hidden md:block font-mono">{u.uid}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setShowPassModal(u); setNewPass(''); setFormError(''); }}
                          className="p-2 rounded-lg text-white/50 hover:text-amber-300 hover:bg-amber-500/20 transition-all" title="Сменить пароль">
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditUser(u)}
                          className="p-2 rounded-lg text-white/50 hover:text-indigo-300 hover:bg-indigo-500/20 transition-all" title="Редактировать">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)}
                          className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/20 transition-all" title="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-white/40">Пользователи не найдены</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLASSES TAB */}
        {tab === 'classes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setClassForm({ name:'', grade:'5', letter:'А' }); setFormError(''); setShowClassModal(true); }}
                className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Добавить класс
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {classes.map(c => (
                <div key={c.id} className="glass rounded-2xl p-5 border border-white/10 text-center group hover:bg-white/15 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-display font-bold text-2xl">{c.name}</p>
                  <p className="text-white/40 text-xs mt-1">{c.grade} класс</p>
                  <button onClick={() => handleDeleteClass(c.id)}
                    className="mt-3 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="col-span-full glass rounded-2xl p-12 text-center text-white/40">
                  Нет классов. Добавьте первый класс.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <Modal title={editUser ? 'Редактировать пользователя' : 'Новый пользователь'} onClose={() => setShowUserModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">ФИО *</label>
              <input type="text" value={userForm.fullName} onChange={e => setUserForm(p => ({...p, fullName: e.target.value}))}
                className="input-field" placeholder="Иванов Иван Иванович" />
            </div>
            {!editUser && (
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Имя пользователя *</label>
                <input type="text" value={userForm.username} onChange={e => setUserForm(p => ({...p, username: e.target.value.toLowerCase()}))}
                  className="input-field" placeholder="ivanov_ivan" />
              </div>
            )}
            {!editUser && (
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Пароль *</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm(p => ({...p, password: e.target.value}))}
                  className="input-field" placeholder="••••••••" />
              </div>
            )}
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Роль</label>
              <select value={userForm.role} onChange={e => setUserForm(p => ({...p, role: e.target.value}))}
                className="input-field">
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            {(userForm.role === 'student' || userForm.role === 'class_teacher') && (
              <div>
                <label className="block text-white/70 text-sm mb-1.5">Класс</label>
                <select value={userForm.classId} onChange={e => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setUserForm(p => ({...p, classId: e.target.value, className: cls?.name || ''}));
                }} className="input-field">
                  <option value="">— Выберите класс —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {formError && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowUserModal(false)} className="flex-1 btn-secondary text-sm py-2.5">Отмена</button>
              <button onClick={handleSaveUser} disabled={saving} className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {editUser ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Password modal */}
      {showPassModal && (
        <Modal title="Сменить пароль" onClose={() => setShowPassModal(null)}>
          <div className="space-y-4">
            <p className="text-white/60 text-sm">Пользователь: <span className="text-white font-medium">{showPassModal.fullName}</span></p>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Новый пароль</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)}
                className="input-field" placeholder="Минимум 4 символа" />
            </div>
            {formError && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowPassModal(null)} className="flex-1 btn-secondary text-sm py-2.5">Отмена</button>
              <button onClick={handleChangePassword} disabled={saving} className="flex-1 btn-primary text-sm py-2.5">
                {saving ? '...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Class modal */}
      {showClassModal && (
        <Modal title="Новый класс" onClose={() => setShowClassModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Параллель</label>
              <select value={classForm.grade} onChange={e => setClassForm(p => ({...p, grade: e.target.value}))}
                className="input-field">
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1.5">Буква</label>
              <input type="text" value={classForm.letter} onChange={e => setClassForm(p => ({...p, letter: e.target.value.toUpperCase().slice(0,1)}))}
                className="input-field" placeholder="А" maxLength={1} />
            </div>
            <p className="text-white/40 text-sm">Класс будет называться: <span className="text-white font-bold">{classForm.grade}{classForm.letter}</span></p>
            {formError && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-300 text-sm">{formError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowClassModal(false)} className="flex-1 btn-secondary text-sm py-2.5">Отмена</button>
              <button onClick={handleCreateClass} disabled={saving} className="flex-1 btn-primary text-sm py-2.5">
                {saving ? '...' : 'Создать'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
