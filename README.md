# Notes (lite)

[![Build](https://img.shields.io/github/actions/workflow/status/bmazurme/lite/build.yml?branch=main&style=flat-square&label=build)](https://github.com/bmazurme/lite/actions/workflows/build.yml)
[![Test](https://img.shields.io/github/actions/workflow/status/bmazurme/lite/test.yml?branch=main&style=flat-square&label=test)](https://github.com/bmazurme/lite/actions/workflows/test.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/bmazurme/lite/deploy.yml?branch=main&style=flat-square&label=deploy)](https://github.com/bmazurme/lite/actions/workflows/deploy.yml)

[![React](https://img.shields.io/badge/React-18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat-square&logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=flat-square&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Cypress](https://img.shields.io/badge/Cypress-17202C?style=flat-square&logo=cypress&logoColor=white)](https://www.cypress.io/)
[![Grafana](https://img.shields.io/badge/Grafana-F46800?style=flat-square&logo=grafana&logoColor=white)](https://grafana.com/)
[![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat-square&logo=prometheus&logoColor=white)](https://prometheus.io/)

Монорепозиторий приложения для заметок с Markdown-редактором, аутентификацией через Яндекс OAuth и встроенным стеком мониторинга.

## Стек

- **Frontend**: React, TypeScript, Redux Toolkit, React Router, Gravity UI, `@diplodoc/transform` / `@gravity-ui/markdown-editor` для Markdown
- **Backend**: NestJS, TypeORM, PostgreSQL, Passport (JWT + Yandex OAuth), Prometheus-метрики
- **Тесты**: Vitest + Testing Library (unit), Cypress (e2e), Jest (backend)
- **Хранилище файлов**: MinIO (S3-совместимый object store) для загрузки изображений
- **Инфраструктура**: Docker Compose, Nginx, Loki, Prometheus, Grafana, pgAdmin

## Структура

```
lite/
├── core/           # NestJS API (порт 3000)
├── client/         # React SPA (порт 80)
├── monitoring/     # Конфиги Loki, Prometheus, Grafana
└── docker-compose.yml
```

## Возможности

- Регистрация и вход через Яндекс OAuth, защита по белому списку email
- JWT-аутентификация с refresh-токенами
- Создание, редактирование и просмотр заметок в формате Markdown
- Загрузка изображений в заметки (с устройства, drag-n-drop, вставка из буфера) в MinIO — помимо вставки по ссылке
- Защищённые роуты на фронтенде (страницы создания и редактирования заметок)
- Логирование (Winston + Loki) и метрики (Prometheus) с дашбордами в Grafana
- E2E-тесты на Cypress, unit-тесты на Vitest и Jest

## Быстрый старт

### Требования

- Docker + Docker Compose
- Зарегистрированное приложение в [Яндекс OAuth](https://oauth.yandex.ru)

### Переменные окружения

Скопируйте и заполните:

```bash
cp core/.env.example core/.env
```

Минимально необходимые переменные в `core/.env`:

```env
JWT_SECRET=
REFRESH_JWT_SECRET=

NOTES_YANDEX_ID=        # ID приложения Яндекс OAuth
NOTES_YANDEX_SECRET=    # Секрет приложения
NOTES_YANDEX_REDIRECT=  # http://<host>/api/v1/oauth/yandex/redirect
NOTES_TARGET_URL=       # URL фронтенда, куда редиректить после входа

EMAILS=user@example.com # Белый список email через запятую
```

Переменные для загрузки изображений (MinIO). При запуске через docker-compose уже
проставлены в `docker-compose.yml`; для локального запуска `core` без Docker задайте
их в `core/.env`:

```env
MINIO_ENDPOINT=localhost   # хост MinIO (в docker-compose — minio)
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NOTES=notes-images  # бакет создаётся автоматически при старте

# База для абсолютных URL картинок. В проде — домен сайта.
# Если не задано, URL выводится из заголовков запроса.
SITE_URL=https://notes.example.dev
```

Опциональные переменные окружения для docker-compose (можно задать в `.env` рядом с `docker-compose.yml`):

| Переменная | По умолчанию | Описание |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Пользователь БД |
| `POSTGRES_PASSWORD` | `postgres` | Пароль БД |
| `POSTGRES_DB_NOTES` | `notes-db` | Имя базы |
| `VITE_API_DOMAIN` | `http://localhost/api/v1` | API URL для сборки фронтенда |
| `VITE_TOKEN` | — | Client ID Яндекс OAuth для фронтенда |
| `MINIO_ROOT_USER` | `minioadmin` | Логин MinIO (он же access key для core) |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | Пароль MinIO (он же secret key для core) |
| `MINIO_BUCKET_NOTES` | `notes-images` | Бакет для изображений |
| `SITE_URL` | `http://localhost` | Домен для абсолютных URL картинок |
| `GRAFANA_USER` | `admin` | Логин Grafana |
| `GRAFANA_PASSWORD` | `admin` | Пароль Grafana |
| `PGADMIN_EMAIL` | `admin@admin.com` | Логин pgAdmin |
| `PGADMIN_PASSWORD` | `admin` | Пароль pgAdmin |

### Запуск

```bash
docker compose up -d
```

| Сервис | URL |
|---|---|
| Приложение | http://localhost |
| API | http://localhost/api/v1 |
| MinIO Console | http://localhost:9001 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| pgAdmin | http://localhost:5050 |

## Сервисы

- **postgres** — PostgreSQL 16, данные в named volume `postgres_data`
- **core** — NestJS API, зависит от postgres и loki
- **client** — nginx, отдаёт SPA и проксирует `/api` → core
- **minio** — S3-совместимый object store для изображений; API на `9000`, консоль на `9001`, данные в volume `minio_data`
- **loki** — хранилище логов (порт не проброшен наружу)
- **prometheus** — сбор метрик с `core:3000/metrics`
- **grafana** — дашборды для Prometheus и Loki, provisioning из `monitoring/grafana/`
- **pgadmin** — веб-интерфейс для PostgreSQL

## Деплой

CI/CD на GitHub Actions:

- **build** — собирает `core` и `client`, проверяет, что Docker-образы собираются
- **test** — запускает unit и e2e тесты `core` и `client`
- **deploy** — при пуше в `main` собирает и пушит образы `core` и `client` в Yandex Cloud Container Registry, затем катит их в Docker Swarm

Прод крутится в single-node Docker Swarm на той же ВМ, что и остальной монолит: rolling update `start-first` с healthcheck и авто-откатом, конкретный тег `:<sha>` вместо `:latest`. Стек, скрипт разовой подготовки ВМ и порядок переключения — в [`deploy/swarm/`](deploy/swarm/README.md).

В продакшене перед `client` и `core` стоит Nginx (конфиг — `client/nginx/nginx.conf`), который отдаёт статику SPA, проксирует `/api` на `core` и терминирует TLS.

## Локальная разработка

Запустите только инфраструктуру:

```bash
docker compose up -d postgres minio loki prometheus grafana pgadmin
```

Затем запустите core и client локально — см. README в каждом пакете.

### Тесты

```bash
# client: unit-тесты
cd client && npm run test

# client: e2e (Cypress)
cd client && npm run cy:open

# core: unit и e2e
cd core && npm run test
cd core && npm run test:e2e
```
