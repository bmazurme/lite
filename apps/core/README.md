# core

NestJS REST API для приложения заметок.

## Стек

- **NestJS 10** + TypeORM + PostgreSQL
- **JWT** — access token (15 мин, Authorization header) + refresh token (7 дней, httpOnly cookie)
- **Passport.js** — Local, JWT, Yandex OAuth стратегии
- **Cache Manager** — in-memory кеш для notes, types, users
- **Winston** — логирование: DailyRotateFile в dev, Loki в prod
- **prom-client** — метрики Prometheus на `/metrics`
- **Swagger** — документация API, доступна только в `NODE_ENV=development`

## Структура

```
src/
├── config/         # cors, typeorm, swagger, logger
├── auth/           # JWT + Local аутентификация
├── oauth/          # Yandex OAuth
├── users/          # Профиль пользователя
├── notes/          # CRUD заметок с пагинацией
├── types/          # Типы/теги заметок
└── metrics/        # Prometheus interceptor + /metrics endpoint
```

## Переменные окружения

```env
NODE_ENV=development

CORS_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost  # Разрешённые origins через запятую

JWT_SECRET=
REFRESH_JWT_SECRET=

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB_NOTES=notes-db

NOTES_YANDEX_ID=              # ID приложения Yandex OAuth
NOTES_YANDEX_SECRET=
NOTES_YANDEX_REDIRECT=        # http://localhost:3000/api/v1/oauth/yandex/redirect
NOTES_TARGET_URL=             # URL фронтенда для редиректа после OAuth

EMAILS=user@example.com       # Белый список email через запятую; если не задан — пускает всех

LOKI_HOST=http://localhost:3100  # Используется только в production
```

## Команды

```bash
npm install

# Разработка (watch mode)
npm run start:dev

# Сборка
npm run build

# Продакшн
npm run start:prod

# Линтинг
npm run lint

# Юнит-тесты
npm test

# Юнит-тесты с покрытием
npm run test:cov

# E2E-тесты
npm run test:e2e

# Миграции
npm run migration:generate src/migrations/MigrationName  # сгенерировать по diff с entities
npm run migration:run                                     # применить pending миграции
npm run migration:revert                                  # откатить последнюю миграцию
npm run migration:show                                    # показать статус миграций
```

## API

Базовый путь: `/api/v1`

| Метод | Путь | Описание |
|---|---|---|
| `GET` | `/oauth/yandex` | Инициировать Yandex OAuth |
| `GET` | `/oauth/yandex/redirect` | Callback Yandex OAuth |
| `POST` | `/auth/login` | Вход по email + пароль |
| `POST` | `/auth/refresh` | Обновить access token по refresh cookie |
| `POST` | `/auth/logout` | Выход |
| `GET` | `/users/me` | Данные текущего пользователя |
| `PATCH` | `/users/:id` | Обновить профиль |
| `GET` | `/notes` | Список заметок (`?page=1`) |
| `GET` | `/notes/type/:typeId` | Заметки по типу (`?page=1`) |
| `GET` | `/notes/:id` | Одна заметка |
| `POST` | `/notes` | Создать заметку |
| `PATCH` | `/notes/:id` | Обновить заметку |
| `DELETE` | `/notes/:id` | Удалить заметку |
| `GET` | `/types` | Список типов |
| `POST` | `/types` | Создать тип |
| `PATCH` | `/types/:id` | Обновить тип |
| `DELETE` | `/types/:id` | Удалить тип |
| `GET` | `/metrics` | Prometheus метрики |

Swagger UI: `/api` (только `NODE_ENV=development`).

## Логи

- **development**: `logs/app-YYYY-MM-DD.log`, ротация 14 дней / 20 МБ / gzip
- **production**: Loki по адресу `LOKI_HOST`
