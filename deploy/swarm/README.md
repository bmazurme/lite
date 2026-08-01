# Деплой в Docker Swarm

Приложение заметок (`lite`) разворачивается собственным стеком в single-node
Docker Swarm, поднятом **на той же ВМ**, где уже работает монолитный
`docker compose` из
[`ntlstl.place.api`](https://github.com/bmazurme/ntlstl.place.api/blob/main/yc/main/docker-compose.yaml).
Swarm стоит рядом с compose-стеком и не конфликтует с ним: compose-контейнеры
остаются под управлением COI-агента, swarm управляет только сервисами `notes_*`.

| | было | стало |
|---|---|---|
| Где описан деплой | `ntlstl.place.api/yc/main/docker-compose.yaml` | [`notes-stack.yml`](notes-stack.yml) в этом репозитории |
| Чем катится | `yc-coi-deploy` (пересборка метаданных ВМ, рестарт всего монолита) | `docker stack deploy` по SSH из [`deploy.yml`](../../.github/workflows/deploy.yml) |
| Что деплоится | `:latest` | конкретный `:${{ github.sha }}` |
| Переменные окружения | `/data/.env` на ВМ | GitHub Secrets, подставляются на раннере |
| Обновление | `docker compose up` — сервис на секунды пропадает | rolling update `start-first` с healthcheck и авто-откатом |
| Откат | вручную | `docker service rollback notes_notes-core` |

Порты остаются прежними — **3450** (API) и **3455** (фронт), поэтому
reverse-proxy перед ВМ трогать не нужно.

## Что деплоится

Два образа — ровно те же, что уже собирает и пушит `deploy.yml`:

- `notes_notes-core` — образ `${CR_HOST}/${CR_REGISTRY}/${CR_IMAGE_CORE}:<sha>`,
  публикует 3450 → 3000, healthcheck на `GET /api/v1/types` (публичный
  эндпоинт, но с реальным походом в БД).
- `notes_client` — nginx со собранной Vite-SPA внутри (`${CR_IMAGE_CLIENT}:<sha>`,
  см. `client/Dockerfile`), публикует 3455 → 80. Он же проксирует `/api`,
  `/rss.xml`, `/sitemap.xml` и пререндер соц-ботов в `notes-core`. Healthcheck
  на `/` — отдаётся из локальной статики и не зависит от бэкенда.
- overlay-сеть `notes_notes` (`attachable`, чтобы можно было отладочно
  подключаться `docker run --network notes_notes …`).

**Имя `notes-core` важно.** `client/nginx/conf.d/default.conf` проксирует на
`http://notes-core:3000` по имени, поэтому сервис в стеке называется ровно так —
иначе nginx не разрезолвит апстрим. Swarm выдаёт каждому сервису стабильный VIP,
который не меняется при пересоздании задач, поэтому кэширование DNS внутри nginx
проблемы не создаёт (по этой же причине здесь не используется
`endpoint_mode: dnsrr`).

Postgres, MinIO и Loki в стек **не входят**: сервис ходит в существующие общие
инстансы compose-стека по адресу хоста (`POSTGRES_HOST` / `MINIO_ENDPOINT` /
`LOKI_HOST` = приватный IP ВМ, порты 5432 / 9000 / 3100 у них уже опубликованы).
Данные не мигрируем.

`docker stack deploy` игнорирует `env_file`, поэтому все переменные
подставляются на раннере из GitHub Secrets. Побочный эффект: секреты видны в
`docker service inspect` на ВМ. Если это станет неприемлемо — переезд на
`docker secret` потребует поддержки `*_FILE`-переменных в core.

## Разовая подготовка ВМ

[`bootstrap.sh`](bootstrap.sh) превращает ВМ в single-node swarm-менеджер и
проверяет всё, от чего зависит стек. Запускается один раз, вручную, **на ВМ** —
из CI он не вызывается.

### Что он делает

1. Определяет основной IPv4 хоста (`ip route get 1.1.1.1`) — он же
   `--advertise-addr` для swarm и он же адрес общих postgres/minio/loki для
   контейнеров.
2. `docker swarm init`, если нода ещё не в swarm. Если уже — только сообщает об
   этом. Compose-стек рядом не трогает: swarm и compose делят один демон, но не
   мешают друг другу.
3. Проверяет, что нода — manager (иначе `docker stack deploy` работать не будет).
4. Проверяет, свободны ли порты 3450 и 3455.
5. Проверяет, что postgres, minio и loki доступны **изнутри контейнера**
   (`docker run alpine nc -z <ip> <порт>`) — важно именно из контейнера, потому
   что сервис ходит в них не по имени, а через адрес хоста.
6. Печатает готовые значения для GitHub Secrets, включая свежий `ssh-keyscan`.

Скрипт идемпотентный: повторный запуск на уже настроенной ноде просто
перевыполнит проверки. Ничего не удаляет и не перезапускает.

### Запуск

Нужен SSH-доступ к ВМ; `sudo` скрипту не требуется — пользователь на COI-ВМ уже
имеет доступ к docker-сокету.

```bash
scp deploy/swarm/bootstrap.sh <user>@<vm>:~/
ssh <user>@<vm> 'bash ~/bootstrap.sh'
ssh <user>@<vm> 'rm ~/bootstrap.sh'   # после — файл больше не нужен
```

### Как читать вывод

```
==> Host address: 10.128.0.11
==> Initialising swarm on 10.128.0.11
Swarm initialized: current node (…) is now a manager.
==> port 3450 is free
==> port 3455 is free
==> Checking postgres at 10.128.0.11:5432 from inside a container
==> postgres is reachable
```

- `[!] port 3450 is still in use` — ожидаемо, если ещё не выполнен шаг 3 из
  «Порядок переключения»: порт держит `notes-core`/`notes-client`
  compose-стека. Swarm при этом поднимется нормально, но деплой стека делать
  рано.
- `[!] postgres is NOT reachable` — деплоить нельзя, core не поднимется.
  Проверьте, что postgres compose-стека жив и по-прежнему публикует 5432 на хост.
  То же для minio (9000): без него отвалятся загрузки картинок. Loki (3100) —
  только логи, приложение без него работает.
- В блоке с секретами скрипт печатает `SWARM_HOST` = **внутренний** IP, потому
  что видит хост изнутри. В секрет нужен адрес, по которому до ВМ достучится
  раннер GitHub, то есть **внешний** IP. Внутренний идёт в `POSTGRES_HOST`,
  `MINIO_ENDPOINT` и `LOKI_HOST`.

### Проверка после запуска

С локальной машины — ровно тот путь, которым ходит job `deploy`:

```bash
DOCKER_HOST=ssh://<user>@<vm> docker info --format '{{.Swarm.ControlAvailable}}'
# true — нода готова принимать docker stack deploy
```

Логиниться в `cr.yandex` на ВМ не нужно: CI передаёт креды реестра с раннера
флагом `--with-registry-auth`.

### Когда запускать повторно

- ВМ пересоздали — swarm-состояние живёт в `/var/lib/docker` и пересоздания не
  переживает.
- Нода почему-то вышла из swarm (`docker info` показывает `Swarm: inactive`).

Обновление метаданных COI-ВМ (обычный деплой `ntlstl.place.api`) swarm не
ломает — повторный запуск после него не нужен.

## Секреты GitHub

Уже были:

| Секрет | Назначение |
|---|---|
| `YC_SA_JSON_CREDENTIALS` | логин в Yandex Container Registry |
| `CR_HOST`, `CR_REGISTRY` | адрес реестра |
| `CR_IMAGE_CORE`, `CR_IMAGE_CLIENT` | имена образов |
| `VITE_API_DOMAIN`, `VITE_TOKEN`, `VITE_SITE_URL` | build-args фронтенда |

Добавить для деплоя:

| Секрет | Назначение |
|---|---|
| `SWARM_HOST` | адрес swarm-менеджера (ВМ) |
| `SWARM_USER` | пользователь SSH на ВМ |
| `SWARM_SSH_KEY` | приватный SSH-ключ без парольной фразы, целиком с `-----BEGIN/END-----` (публичная половина — в `~/.ssh/authorized_keys` на ВМ). Как выпустить и типичные ошибки — [CUTOVER.md, шаг 2](CUTOVER.md#шаг-2-завести-ssh-ключ-для-ci-swarm_ssh_key) |
| `SWARM_SSH_KNOWN_HOSTS` | host key ВМ; без него — `ssh-keyscan` на каждый прогон (TOFU) |
| `POSTGRES_HOST` | приватный IP ВМ, голый хост без схемы и порта (`10.128.0.11`) |
| `POSTGRES_PORT` | необязательно, по умолчанию 5432 |
| `POSTGRES_USER`, `POSTGRES_PASSWORD` | те же значения, что сейчас в `/data/.env` |
| `POSTGRES_DB` | имя БД заметок; core читает его как `POSTGRES_DB_NOTES`. Не секретное — можно завести и как Actions variable |
| `JWT_SECRET`, `REFRESH_JWT_SECRET` | те же, что сейчас на ВМ — иначе разлогинятся все сессии |
| `NOTES_YANDEX_ID`, `NOTES_YANDEX_SECRET`, `NOTES_YANDEX_REDIRECT` | Яндекс OAuth |
| `NOTES_TARGET_URL` | куда редиректить после OAuth (публичный хост) |
| `EMAILS` | белый список email через запятую; пусто/не задан — пускаем всех |
| `COOKIE_DOMAIN` | домен cookie (`notes.ntlstl.dev`) |
| `CORS_ORIGINS` | список origin'ов через запятую |
| `LOKI_HOST` | **полный URL** со схемой и портом: `http://10.128.0.11:3100` (`winston-loki` принимает URL целиком) |
| `MINIO_ENDPOINT` | **голый хост** без схемы и порта: `10.128.0.11` (MinIO SDK берёт хост, порт и TLS раздельно) |
| `MINIO_PORT`, `MINIO_USE_SSL` | необязательно, по умолчанию 9000 / false |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | те же, что сейчас на ВМ |
| `MINIO_BUCKET_NOTES` | необязательно, по умолчанию `notes-images` |

`SITE_URL` для core берётся из уже существующего `VITE_SITE_URL` — это тот же
публичный origin, что запекается в клиентский бандл, и отдельный секрет для него
не нужен.

## Порядок переключения

Swarm-стек забирает порты 3450/3455 у compose-стека, одновременно держать их
нельзя, поэтому переключение делается по шагам и с коротким окном простоя.

**Подробная пошаговая инструкция — в [CUTOVER.md](CUTOVER.md)**: сбор текущих
значений с ВМ, ключ для CI, репетиция стека на запасных портах без простоя,
само окно переключения, проверки (включая превью ссылок в мессенджерах) и откат.

Кратко:

1. `bootstrap.sh` на ВМ — поднять swarm рядом с compose.
2. Завести SSH-ключ для раннера и прописать секреты из таблицы выше.
3. Прогнать стек на запасных портах (`CORE_PORT`/`CLIENT_PORT`) — прод при
   этом продолжает работать на compose.
4. Удалить `notes-core` и `notes-client` из
   `ntlstl.place.api/yc/main/docker-compose.yaml` и смержить — с этого момента
   начинается простой.
5. Пуш в `main` этого репозитория — CI соберёт образы и поднимет стек на
   3450/3455.
6. Проверить API, фронт, RSS, загрузку картинок и превью в мессенджерах.

Значения из `/data/.env` после переключения этим приложением не используются
(файл общий с другими сервисами монолита — удалять его нельзя, но notes-ключи
в нём становятся мёртвыми).

## Эксплуатация

```bash
export DOCKER_HOST=ssh://<user>@<vm>          # или ssh на ВМ и без переменной

docker stack ps notes                         # состояние задач
docker service logs -f notes_notes-core       # логи
docker service rollback notes_notes-core      # откат на предыдущий образ
docker service scale notes_client=2           # больше реплик (ВМ 2 vCPU / 2 GB — с оглядкой)
docker stack rm notes                         # снять стек целиком
```

Ручной деплой конкретного тега без CI:

```bash
export DOCKER_HOST=ssh://<user>@<vm>
export CR_HOST=… CR_REGISTRY=… CR_IMAGE_CORE=… CR_IMAGE_CLIENT=… IMAGE_TAG=<sha>
export POSTGRES_HOST=… POSTGRES_USER=… POSTGRES_PASSWORD=… POSTGRES_DB=…
export JWT_SECRET=… REFRESH_JWT_SECRET=… NOTES_TARGET_URL=… COOKIE_DOMAIN=… SITE_URL=…
export LOKI_HOST=… MINIO_ENDPOINT=… MINIO_ACCESS_KEY=… MINIO_SECRET_KEY=…
docker stack deploy -c deploy/swarm/notes-stack.yml --with-registry-auth --prune notes
```

## Ограничения

- **Ingress swarm слушает только IPv4.** Compose публиковал порты в обе
  стороны (`0.0.0.0:3450` и `:::3450`), swarm — только на IPv4. Поэтому
  reverse-proxy перед ВМ обязан ходить на `127.0.0.1`, а не на `localhost`:
  `localhost` резолвится в `127.0.0.1` **и** `::1`, nginx считает это апстрим-
  группой из двух серверов и половину запросов шлёт в `[::1]`, где никто не
  слушает. Симптом — плавающие `502`/таймауты и `no live upstreams` в
  `/var/log/nginx/error.log`. Подробнее — [CUTOVER.md](CUTOVER.md#грабли-ingress-swarm-слушает-только-ipv4).
- Нода одна, поэтому swarm здесь даёт rolling update, healthcheck-гейт и
  откат, но не отказоустойчивость: ВМ падает — падает всё.
- `docker swarm init` живёт в `/var/lib/docker` и переживает обновление
  метаданных COI-ВМ, но **не** её пересоздание. Если ВМ пересоздадут —
  повторить `bootstrap.sh`.
- **Миграции.** В проде TypeORM гоняет `migrations` на старте
  (`migrationsRun: !isDev`), а `start-first` означает, что несколько секунд
  рядом живут старая и новая задача. Миграция выполняется новой задачей, пока
  старая ещё обслуживает трафик, — значит, миграции должны быть совместимы со
  старой версией кода (добавляем колонки, а не переименовываем/удаляем в один
  шаг). Healthcheck на `/api/v1/types` ждёт `start_period: 40s` — этого хватает
  на короткие миграции; для долгих окно придётся увеличить, иначе swarm сочтёт
  задачу нездоровой и откатится.
- Образ фронтенда собирается с запечёнными `VITE_API_DOMAIN` / `VITE_TOKEN` /
  `VITE_SITE_URL` (build-args в `deploy.yml`). Поменять адрес API, публичный
  origin или Yandex client id **без пересборки** образа нельзя — переменные
  окружения в стеке на это не влияют.
- Пререндер для соц-скрейперов держится на связке двух образов: `client/nginx`
  по User-Agent переписывает запросы ботов на `/__prerender…`, а отвечает на них
  `core` модулем `src/prerender/`. Если модуль удалить — превью в мессенджерах
  начнут отдавать 404, при том что для людей и поисковиков ничего не сломается,
  то есть заметить регрессию по обычным проверкам нельзя. Смоук-тест из
  [CUTOVER.md](CUTOVER.md#шаг-7-проверки) специально дёргает этот путь с ботовым
  User-Agent.
- `SITE_URL` у core обязателен именно из-за пререндера: из него строятся
  абсолютные `og:image` и `canonical`. При неверном значении соцсети получат
  ссылки на чужой (или локальный) хост.
- Реплик по одной. При `replicas: 1` и `start-first` во время обновления
  секунды работают две задачи одновременно; обе пишут в одну БД — для этого
  приложения безопасно.
