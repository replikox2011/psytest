// src/pages/NotFound.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-display font-black text-white/10 mb-4">404</div>
        <AlertCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <h1 className="text-white font-display font-bold text-2xl mb-2">Страница не найдена</h1>
        <p className="text-white/50 mb-8">Возможно, она была перемещена или удалена</p>
        <button onClick={() => navigate('/dashboard')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg">
          ← На главную
        </button>
      </div>
    </div>
  );
}
