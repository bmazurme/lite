# client

React SPA для приложения заметок с Markdown-редактором и аутентификацией через Yandex OAuth.

## Стек

- **React 18** + **React Router 7**
- **Redux Toolkit** + **RTK Query** — стейт и запросы к API
- **Gravity UI** — компонентная библиотека
- **Vite** — сборщик
- **Vitest** + **Testing Library** — юнит-тесты
- **Cypress** — e2e-тесты

## Переменные окружения

```env
VITE_API_DOMAIN=http://localhost/api/v1  # Базовый URL API
VITE_TOKEN=                              # Client ID приложения Yandex OAuth
```

## Команды

```bash
npm install

# Разработка
npm run dev

# Сборка
npm run build

# Предпросмотр сборки
npm run preview

# Линтинг
npm run lint
npm run lint:fix

# Юнит-тесты
npm test

# Юнит-тесты в watch-режиме
npm run test:watch

# Юнит-тесты с покрытием
npm run test:coverage

# E2E (Cypress интерактивно)
npm run cy:open

# E2E (Cypress headless)
npm run cy:run

# E2E в Docker
npm run cy:docker
```

## Структура

```
src/
├── components/     # Переиспользуемые компоненты
├── pages/          # Страницы приложения
├── store/          # Redux store, RTK Query API, слайсы
├── hooks/          # Кастомные хуки
└── utils/          # Константы
```

## Страницы

| Путь | Описание |
|---|---|
| `/` | Главная, список заметок |
| `/oauth` | Вход через Yandex OAuth |
| `/oauth-error` | Ошибка входа (email не в белом списке) |
| `/profile` | Профиль пользователя |
| `/add-note` | Создать заметку |
| `/edit-note/:noteId` | Редактировать заметку |
| `/note/:noteId` | Просмотр заметки |
| `/notes/type/:typeId` | Заметки по типу |

## Аутентификация

Access token хранится в Redux store (in-memory). При истечении срока RTK Query автоматически обновляет его через `/auth/refresh`, используя httpOnly refresh cookie. При ошибке обновления пользователь перенаправляется на `/oauth`.
