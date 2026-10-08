// src/firebase/services.js
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, setDoc, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from './config';
import { hashPassword, generateUID } from '../utils/crypto';

// ─── USERS ───────────────────────────────────────────────────────────────────

export const getUserByUsername = async (username) => {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const createUser = async (userData) => {
  // Проверяем лимит 24 ученика на класс
  if (userData.role === 'student' && userData.classId) {
    const q = query(collection(db, 'users'), where('classId', '==', userData.classId), where('role', '==', 'student'));
    const snap = await getDocs(q);
    if (snap.size >= 24) {
      throw new Error(`В классе ${userData.className} уже 24 ученика — максимум достигнут`);
    }
  }
  const uid = generateUID();
  const salt = Math.random().toString(36).substring(2);
  const passwordHash = hashPassword(userData.password, salt);
  const { password, ...rest } = userData;
  const docRef = await addDoc(collection(db, 'users'), {
    ...rest,
    uid,
    salt,
    passwordHash,
    username: userData.username.toLowerCase(),
    createdAt: serverTimestamp(),
    firstLogin: true,
  });
  return { id: docRef.id, uid };
};

export const updateUser = async (userId, data) => {
  await updateDoc(doc(db, 'users', userId), data);
};

export const deleteUser = async (userId) => {
  await deleteDoc(doc(db, 'users', userId));
};

export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUsersByRole = async (role) => {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUsersByClass = async (classId) => {
  const q = query(collection(db, 'users'), where('classId', '==', classId), where('role', '==', 'student'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.fullName.localeCompare(b.fullName));
};

export const checkUsernameExists = async (username) => {
  const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
};

export const changeUserPassword = async (userId, newPassword) => {
  const salt = Math.random().toString(36).substring(2);
  const passwordHash = hashPassword(newPassword, salt);
  await updateDoc(doc(db, 'users', userId), { salt, passwordHash });
};

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export const getAllClasses = async () => {
  const snap = await getDocs(collection(db, 'classes'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const gradeA = parseInt(a.grade || a.name);
      const gradeB = parseInt(b.grade || b.name);
      if (gradeA !== gradeB) return gradeA - gradeB;
      return (a.letter || '').localeCompare(b.letter || '');
    });
};

export const createClass = async (data) => {
  const docRef = await addDoc(collection(db, 'classes'), { ...data, createdAt: serverTimestamp() });
  return docRef.id;
};

export const deleteClass = async (classId) => {
  await deleteDoc(doc(db, 'classes', classId));
};

// ─── TESTS ───────────────────────────────────────────────────────────────────

export const createTest = async (testData) => {
  const docRef = await addDoc(collection(db, 'tests'), {
    ...testData,
    createdAt: serverTimestamp(),
    status: testData.status || 'draft',
  });
  return docRef.id;
};

export const getAllTests = async () => {
  const snap = await getDocs(collection(db, 'tests'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
};

export const getTestsByTarget = async (targetRole) => {
  const q = query(collection(db, 'tests'), where('targetRole', '==', targetRole), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getActiveTestsForUser = async (targetRole) => {
  const now = new Date();
  const q = query(collection(db, 'tests'), where('targetRole', '==', targetRole), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => {
    if (t.startDate && new Date(t.startDate) > now) return false;
    if (t.endDate && new Date(t.endDate) < now) return false;
    return true;
  });
};

export const updateTest = async (testId, data) => {
  await updateDoc(doc(db, 'tests', testId), data);
};

export const deleteTest = async (testId) => {
  await deleteDoc(doc(db, 'tests', testId));
};

export const getTestById = async (testId) => {
  const snap = await getDoc(doc(db, 'tests', testId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

export const addQuestion = async (testId, questionData) => {
  const docRef = await addDoc(collection(db, 'questions'), {
    ...questionData,
    testId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getQuestionsByTest = async (testId) => {
  const q = query(collection(db, 'questions'), where('testId', '==', testId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const updateQuestion = async (questionId, data) => {
  await updateDoc(doc(db, 'questions', questionId), data);
};

export const deleteQuestion = async (questionId) => {
  await deleteDoc(doc(db, 'questions', questionId));
};

// ─── RESPONSES ───────────────────────────────────────────────────────────────

export const submitResponse = async (responseData) => {
  const docRef = await addDoc(collection(db, 'responses'), {
    ...responseData,
    submittedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const hasUserCompletedTest = async (userId, testId) => {
  const q = query(collection(db, 'responses'), where('userId', '==', userId), where('testId', '==', testId));
  const snap = await getDocs(q);
  return !snap.empty;
};

export const getResponsesByTest = async (testId) => {
  const q = query(collection(db, 'responses'), where('testId', '==', testId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getResponsesByTestAndClass = async (testId, classId) => {
  const q = query(collection(db, 'responses'), where('testId', '==', testId), where('classId', '==', classId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getUserResponseForTest = async (userId, testId) => {
  const q = query(collection(db, 'responses'), where('userId', '==', userId), where('testId', '==', testId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const getResponsesByUser = async (userId) => {
  const q = query(collection(db, 'responses'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
