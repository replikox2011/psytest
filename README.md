# 🏫 PsychSystem — Muhammad al-Xorazmiy School

Школьная психологическая система для:  
**"Muhammad al-Xorazmiy nomidagi ixtisoslashtirilgan maktabi Nukus filiali"**

---

## ⚡ Быстрый старт

```bash
npm install
npm start
```

Открыть: http://localhost:3000

---

## 🔥 Настройка Firebase

### 1. Создайте проект в [Firebase Console](https://console.firebase.google.com)

### 2. Включите Firestore Database
- Mode: **Production**
- Region: `asia-southeast1` (ближайший)

### 3. Создайте `.env` файл на основе `.env.example`:
Скопируйте пример файла конфигурации:
```bash
cp .env.example .env
```
И заполните переменные в `.env`:
```env
# Firebase
REACT_APP_FIREBASE_API_KEY=ваш_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=ваш_проект.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=ваш_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=ваш_проект.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
REACT_APP_FIREBASE_APP_ID=ваш_app_id

# Данные администратора для инициализации (/setup)
REACT_APP_ADMIN_FULL_NAME=Ваше ФИО
REACT_APP_ADMIN_USERNAME=логин_админа
REACT_APP_ADMIN_EMAIL=admin@school.uz
REACT_APP_ADMIN_PASSWORD=ваш_надежный_пароль
REACT_APP_ADMIN_SALT=любая_секретная_соль
```
> 🔒 Файл `.env` добавлен в `.gitignore` и никогда не попадет в публичный репозиторий.


### 4. Правила Firestore (`Firestore > Rules`):
Правила безопасности вынесены в файл [firestore.rules](file:///Users/nodirbek/nodirbek/school-projects/psytest/firestore.rules).

Скопируйте содержимое файла в **Firebase Console → Firestore Database → Rules** или выполните деплой через Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
> 🛡️ Правила содержат строгую валидацию схем для коллекций `users`, `classes`, `tests`, `questions`, `responses` и запрет на произвольные коллекции.

### 5. Создайте первого администратора вручную в Firestore
В коллекции `users` создайте документ:
```json
{
  "fullName": "Администратор",
  "username": "admin",
  "role": "admin",
  "uid": "UID-ADMIN001",
  "salt": "mysalt",
  "passwordHash": "<sha256(password + salt)>",
  "firstLogin": false,
  "nickname": "admin",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

Для генерации хеша пароля в консоли браузера:
```js
import { sha256 } from 'js-sha256';
sha256('yourpassword' + 'mysalt');
```

---

## 🏗 Сборка и деплой

### Сборка:
```bash
npm run build
```

### Деплой на Netlify:
**Вариант 1 (автоматический):**
1. Подключите GitHub репозиторий к Netlify
2. Build command: `npm run build`
3. Publish directory: `build`

**Вариант 2 (ручной):**
1. Запустите `npm run build`
2. Перетащите папку `build/` на [netlify.com/drop](https://app.netlify.com/drop)

> ✅ Файл `public/_redirects` уже включён для React Router

---

## 📁 Структура проекта

```
src/
├── firebase/
│   ├── config.js          # Firebase конфигурация
│   └── services.js        # Все функции работы с БД
├── contexts/
│   └── AuthContext.js     # Авторизация (localStorage)
├── utils/
│   └── crypto.js          # SHA256 хэширование, генерация UID
├── components/
│   └── Layout.js          # Sidebar + мобильное меню
└── pages/
    ├── LoginPage.js        # Вход в систему
    ├── Dashboard.js        # Главный дашборд
    ├── TestsPage.js        # Список тестов
    ├── TakeTestPage.js     # Прохождение теста (step-by-step)
    ├── ResultsPage.js      # Мои ответы
    ├── AdminPanel.js       # Управление пользователями и классами
    ├── PsychPanel.js       # Создание тестов + просмотр результатов
    ├── ProfilePage.js      # Профиль + смена пароля
    ├── SetupNicknamePage.js # Первый вход — выбор никнейма
    └── NotFound.js         # 404
```

---

## 🗂 Структура Firestore

```
users/
  {id}/
    fullName: string
    username: string (lowercase)
    role: admin | psychologist | director | deputy | teacher | class_teacher | student
    uid: string (UID-XXXXXXXX)
    salt: string
    passwordHash: string
    classId?: string
    className?: string
    nickname?: string
    firstLogin: boolean
    createdAt: timestamp

classes/
  {id}/
    name: string (5А, 7Б...)
    grade: string
    letter: string
    createdAt: timestamp

tests/
  {id}/
    title: string
    description?: string
    category?: string
    targetRole: student | teacher
    anonymity: open | anonymous
    status: draft | active | closed
    startDate?: string
    endDate?: string
    createdBy: string (userId)
    createdAt: timestamp

questions/
  {id}/
    testId: string
    text: string
    type: yes_no | choice | free
    options?: string[]  (for choice type)
    order: number
    createdAt: timestamp

responses/
  {id}/
    testId: string
    userId: string
    userFullName?: string (null if anonymous)
    classId?: string
    className?: string
    answers: { [questionId]: string }
    isAnonymous: boolean
    submittedAt: timestamp
```

---

## 🔐 Роли и доступы

| Роль           | Тесты | Результаты | Пользователи | Классы |
|----------------|-------|------------|--------------|--------|
| admin          | ✅ все | ✅ все    | ✅ CRUD      | ✅ CRUD |
| psychologist   | ✅ CRUD| ✅ все    | 👁 просмотр  | 👁 просмотр |
| director       | 👁    | 👁 (агрег) | ❌           | 👁 |
| deputy         | 👁    | 👁 (агрег) | ❌           | 👁 |
| class_teacher  | 👁    | 👁 своего класса | ❌    | ❌ |
| teacher        | ✅ проходить | 👁 свои | ❌        | ❌ |
| student        | ✅ проходить | 👁 свои | ❌        | ❌ |

---

## 🎨 UI дизайн

- **Фон**: градиент indigo → purple → blue
- **Карточки**: glassmorphism (backdrop-blur)
- **Шрифты**: Syne (display) + Nunito (body)
- **Анимации**: slide-up, fade-in, float
- **Адаптивность**: mobile-first, sidebar → drawer

---

## 🛠 Технологии

- React 18 + React Router v6
- Tailwind CSS
- Firebase Firestore (без Auth)
- SHA256 + salt (js-sha256)
- Lucide React (иконки)
