// src/utils/crypto.js
import { sha256 } from 'js-sha256';

export const hashPassword = (password, salt) => {
  return sha256(password + salt);
};

export const verifyPassword = (password, salt, hash) => {
  return sha256(password + salt) === hash;
};

export const generateUID = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uid = 'UID-';
  for (let i = 0; i < 8; i++) {
    uid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uid;
};

export const generateNicknameSuggestions = (fullName) => {
  const parts = fullName.trim().split(' ');
  const base = parts[0].toLowerCase().replace(/[^a-zа-яё0-9]/gi, '');
  const suggestions = [
    base,
    base + Math.floor(Math.random() * 99),
    (parts[0] + (parts[1] ? parts[1][0] : '')).toLowerCase().replace(/[^a-zа-яё0-9]/gi, ''),
  ];
  return suggestions;
};
