// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserByUsername } from '../firebase/services';
import { verifyPassword } from '../utils/crypto';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('psych_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const userData = await getUserByUsername(username);
    if (!userData) throw new Error('Пользователь не найден');
    const valid = verifyPassword(password, userData.salt, userData.passwordHash);
    if (!valid) throw new Error('Неверный пароль');
    const sessionUser = {
      id: userData.id, uid: userData.uid, username: userData.username,
      fullName: userData.fullName, role: userData.role,
      classId: userData.classId, className: userData.className,
      firstLogin: userData.firstLogin, nickname: userData.nickname,
      subjectIds: userData.subjectIds,
    };
    setUser(sessionUser);
    localStorage.setItem('psych_user', JSON.stringify(sessionUser));
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('psych_user');
  };

  const refreshUser = async () => {
    if (!user) return;
    const updated = await getUserByUsername(user.username);
    if (updated) {
      const sessionUser = {
        id: updated.id, uid: updated.uid, username: updated.username,
        fullName: updated.fullName, role: updated.role,
        classId: updated.classId, className: updated.className,
        firstLogin: updated.firstLogin, nickname: updated.nickname,
        subjectIds: updated.subjectIds,
      };
      setUser(sessionUser);
      localStorage.setItem('psych_user', JSON.stringify(sessionUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
