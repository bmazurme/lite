# Бэкап прод-данных (Postgres + MinIO)

Как снять с прод-ВМ дамп базы `notes-db` и файлы бакета `notes-images`, и
как восстановить их локально (в `docker-compose.yml` этого репозитория) —
для локальной разработки на реальных данных или как аварийный бэкап.

Прод-ВМ (`89.169.132.49`) держит несколько приложений на одном Docker
(и внутри него — swarm-стек `notes`, см. [swarm/README.md](swarm/README.md)).
Ничего не мигрируем и не трогаем на постоянной основе — только читаем и
скачиваем копию.

## Что понадобится

- SSH-доступ на ВМ: `ssh <user>@<vm>` (ключ может быть с паролем — тогда
  сначала `ssh-add ~/.ssh/<key>`, введите пароль).
- Локально: `docker`, `docker compose`, и MinIO client `mc`
  (`brew install minio-mc`, если ещё не стоит).

## Шаг 1. Найти актуальное имя контейнера notes-core

Имя меняется между `docker-compose`/`swarm`-развёртываниями, поэтому не
угадывайте — посмотрите:

```bash
ssh <user>@<vm> 'docker ps --format "{{.Names}}\t{{.Status}}" | grep notes'
```

Ожидаемо что-то вроде `notes_notes-core.1.<hash>` (swarm) или `notes-core`
(compose).

## Шаг 2. Достать креды из его переменных окружения

```bash
ssh <user>@<vm> 'docker inspect <notes-core-container> --format "{{range .Config.Env}}{{println .}}{{end}}"'
```

Нужны: `POSTGRES_DB_NOTES`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`MINIO_BUCKET_NOTES`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`.

**Не берите креды из контейнера `postgres` напрямую** — на этой ВМ он общий
для нескольких приложений, там лежит *не тот* `POSTGRES_DB` (дефолтный, для
другого проекта).

## Шаг 3. Дамп Postgres

Выполняется внутри уже работающего контейнера `postgres` — новый контейнер
поднимать не нужно:

```bash
ssh <user>@<vm> 'docker exec postgres pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB_NOTES> -F c -f /tmp/notes-db.dump'
ssh <user>@<vm> 'docker cp postgres:/tmp/notes-db.dump /tmp/notes-db.dump'
scp <user>@<vm>:/tmp/notes-db.dump ./notes-db.dump
ssh <user>@<vm> 'docker exec postgres rm -f /tmp/notes-db.dump && rm -f /tmp/notes-db.dump'   # прибрать за собой
```

## Шаг 4. Файлы MinIO (картинки)

На ВМ обычно нет `mc`/`aws`, а поднимать новый контейнер ради разового
дампа — лишний риск на проде. Проще пробросить порт по SSH и скачать
локальным `mc`:

```bash
ssh -L 19000:127.0.0.1:9000 <user>@<vm>
```

Оставьте эту сессию открытой и в другом терминале:

```bash
mc alias set prod-tunnel http://127.0.0.1:19000 <MINIO_ACCESS_KEY> <MINIO_SECRET_KEY>
mc du prod-tunnel/<MINIO_BUCKET_NOTES>                      # сколько скачивать
mc mirror prod-tunnel/<MINIO_BUCKET_NOTES> ./minio-dump/<MINIO_BUCKET_NOTES>
mc alias remove prod-tunnel                                  # креды не хранить в конфиге mc
```

Закройте туннель (`Ctrl+C` в первом терминале) после скачивания.

## Шаг 5. Восстановить локально

В этом репозитории, `docker-compose.yml` уже описывает `postgres` и `minio`
с дефолтными кредами для локальной разработки (`postgres`/`postgres`,
`minioadmin`/`minioadmin`, БД `notes-db`, бакет `notes-images`) — их не надо
подгонять под прод-значения.

```bash
docker compose up -d postgres minio
# дождаться healthy:
docker compose ps postgres minio
```

**Postgres:**

```bash
docker cp ./notes-db.dump lite-postgres-1:/tmp/notes-db.dump
docker exec lite-postgres-1 pg_restore -U postgres -d notes-db \
  --clean --if-exists --no-owner --no-privileges -v /tmp/notes-db.dump
```

`--clean --if-exists` — безопасно поверх уже существующей локальной схемы
(TypeORM миграции создают её при первом старте `notes-core`).
`--no-owner --no-privileges` — на проде роль может называться иначе, чем
локальный `postgres`.

**MinIO:**

```bash
mc alias set local http://127.0.0.1:9000 minioadmin minioadmin
mc mb --ignore-existing local/notes-images
mc mirror ./minio-dump/notes-images local/notes-images
mc alias remove local
```

## Шаг 6. Переписать абсолютные прод-ссылки на картинки (обязательно)

Часть заметок хранит обложку/картинки не относительным путём, а абсолютным
URL на прод (`https://notes.ntlstl.dev/api/v1/uploads/...`) — так исторически
вставлялись при написании. Прод отдаёт эти файлы с заголовком
`Cross-Origin-Resource-Policy: same-origin`, поэтому **браузер молча
блокирует их** при просмотре с любого другого origin — включая
`localhost:5173`. `curl` эту проверку не делает и покажет `200`, так что
проблема не видна из терминала — только как битые картинки в самом
интерфейсе.

Ключи файлов те же самые (мы скачали ровно эти объекты в Шаге 4), поэтому
достаточно переписать URL на относительный путь — дальше его отдаст
локальный `notes-core` через тот же `/api/v1/uploads/...`:

```bash
docker exec -i lite-postgres-1 psql -U postgres -d notes-db <<'EOF'
BEGIN;
UPDATE note SET content = replace(content, 'https://notes.ntlstl.dev/api/v1/uploads/', '/api/v1/uploads/')
WHERE content LIKE '%https://notes.ntlstl.dev/api/v1/uploads/%';
UPDATE note SET preview = replace(preview, 'https://notes.ntlstl.dev/api/v1/uploads/', '/api/v1/uploads/')
WHERE preview LIKE '%https://notes.ntlstl.dev/api/v1/uploads/%';
UPDATE note SET "coverImage" = replace("coverImage", 'https://notes.ntlstl.dev/api/v1/uploads/', '/api/v1/uploads/')
WHERE "coverImage" LIKE '%https://notes.ntlstl.dev/api/v1/uploads/%';
COMMIT;
EOF
```

`docker exec` без `-i` не пробрасывает stdin — heredoc молча ничего не
сделает (0 строк изменено), если флаг забыть.

Это чисто локальное изменение данных — прод не трогается (мы правим
`lite-postgres-1`, а не прод-БД).

## Шаг 7. Проверка

```bash
docker compose up -d --build notes-core loki   # если ещё не поднят
curl -s http://localhost:3000/api/v1/notes/pages/1 | head -c 300
```

Дальше `npm run dev` в `apps/client/` (Vite на 5173) подхватит `notes-core` на
`http://localhost:3000/api/v1` по умолчанию, а `vite.config.ts` уже
проксирует `/api` → `http://localhost:3000` (нужно для относительных
`coverImage`, см. `toRelativeImageUrl` в `utils/image-url.ts`) — заметки и
обложки должны появиться в интерфейсе.

## Заметки

- Секреты (`POSTGRES_PASSWORD`, `MINIO_*_KEY`) нигде не сохраняются —
  используются только в моменте команд выше. Не коммитьте файлы дампа
  (`*.dump`, `minio-dump/`) в репозиторий.
- Если восстанавливаете не в этот `docker-compose.yml`, а на отдельный
  сервер — креды и адреса `POSTGRES_HOST`/`MINIO_ENDPOINT` там свои, эта
  инструкция не про это (см. [swarm/CUTOVER.md](swarm/CUTOVER.md) для
  переезда самого приложения между хостами).
