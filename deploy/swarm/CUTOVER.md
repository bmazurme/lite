# Переключение на Docker Swarm — пошаговая инструкция

Как перевести прод с монолитного compose-стека
[`ntlstl.place.api`](https://github.com/bmazurme/ntlstl.place.api/blob/main/yc/main/docker-compose.yaml)
на собственный swarm-стек этого репозитория. Общее описание архитектуры — в
[README.md](README.md), здесь только порядок действий.

**Главное ограничение.** Swarm-стек публикует те же порты хоста, что сейчас
держит compose: **3450** (API) и **3455** (фронт). Одновременно их держать
нельзя, поэтому между «убрали из compose» и «подняли в swarm» приложение
недоступно. Всё остальное делается заранее и простоя не требует.

**Простой:** ориентировочно 3–7 минут (шаги 5–6). Шаги 0–4 — без простоя,
делаются в любой удобный день.

**Что понадобится:**

- SSH-доступ на ВМ (тот же пользователь, что уже ходит туда);
- права на secrets репозитория `bmazurme/lite`;
- права мержить в `main` в `bmazurme/ntlstl.place.api`;
- локально — docker CLI (для репетиции на шаге 4).

Дальше `<vm>` — адрес ВМ, `<user>` — SSH-пользователь на ней.

---

## Шаг 0. Собрать текущие значения с ВМ

Секреты переезжают из `/data/.env` на ВМ в GitHub Secrets. Сначала выпишите то,
что там сейчас — **это единственная копия**, и после переключения приложение её
читать перестанет.

```bash
ssh <user>@<vm>
grep -E '^(POSTGRES_|JWT_SECRET|REFRESH_JWT_SECRET|NOTES_|EMAILS|COOKIE_DOMAIN|CORS_ORIGINS|MINIO_|SITE_URL)' /data/.env
```

Если чего-то в файле нет — посмотрите, с чем реально запущен контейнер:

```bash
docker inspect notes-core --format '{{range .Config.Env}}{{println .}}{{end}}'
```

Заодно запишите приватный IP ВМ — он станет адресом общих postgres/minio/loki
для контейнеров стека:

```bash
ip -4 route get 1.1.1.1 | awk '{print $7; exit}'
```

`JWT_SECRET` и `REFRESH_JWT_SECRET` перенесите **точь-в-точь**: с новыми
значениями у всех пользователей протухнут сессии.

---

## Шаг 1. Поднять swarm на ВМ

```bash
scp deploy/swarm/bootstrap.sh <user>@<vm>:~/
ssh <user>@<vm> 'bash ~/bootstrap.sh'
```

Скрипт идемпотентный, ничего не удаляет и compose-стек не трогает. Ожидаемый
вывод:

```
==> Host address: 10.128.0.11
==> Initialising swarm on 10.128.0.11
Swarm initialized: current node (…) is now a manager.
[!] port 3450 is still in use — most likely notes-core/notes-client
[!] port 3455 is still in use — most likely notes-core/notes-client
==> Checking postgres at 10.128.0.11:5432 from inside a container
==> postgres is reachable
==> minio is reachable
==> loki is reachable
```

- Предупреждения про занятые 3450/3455 на этом шаге **нормальны** — порты пока у
  compose, отдадим их на шаге 5.
- А вот `[!] postgres is NOT reachable` или `minio is NOT reachable` — стоп.
  Дальше идти нельзя: core не поднимется (postgres) или отвалятся картинки
  (minio). Разберитесь, публикуют ли эти контейнеры порты на хост.

В конце скрипт печатает готовые значения для секретов — сохраните вывод.

Проверка, что нода готова принимать деплой (с локальной машины — тем же путём,
которым пойдёт CI):

```bash
DOCKER_HOST=ssh://<user>@<vm> docker info --format '{{.Swarm.ControlAvailable}}'
# true
```

Файл на ВМ больше не нужен: `ssh <user>@<vm> 'rm ~/bootstrap.sh'`.

---

## Шаг 2. Завести SSH-ключ для CI (`SWARM_SSH_KEY`)

Джоб `deploy` ходит на ВМ через `DOCKER_HOST=ssh://<user>@<vm>` — то есть
обычным SSH, просто docker CLI гоняет по нему свой протокол. Значит раннеру
нужен приватный ключ, а ВМ — его публичная половина.

**2.1. Сгенерировать отдельную пару.** Не переиспользуйте личный ключ: этот
живёт в секретах GitHub, и отозвать его надо уметь независимо от своего.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/lite-swarm-deploy -N '' -C 'github-actions lite deploy'
```

- `-N ''` — **без пароля**. Раннер не сможет его ввести; ключ с парольной фразой
  просто не заработает.
- `-t ed25519` — короткий ключ, целиком помещается в секрет без сюрпризов.
  RSA тоже подойдёт, но тогда генерируйте `-t rsa -b 4096`.

Получится два файла: `~/.ssh/lite-swarm-deploy` (приватный — он и пойдёт в
секрет) и `~/.ssh/lite-swarm-deploy.pub` (публичный — на ВМ).

**2.2. Положить публичную половину на ВМ:**

```bash
ssh-copy-id -i ~/.ssh/lite-swarm-deploy.pub <user>@<vm>
```

Если `ssh-copy-id` нет (macOS без brew-версии openssh):

```bash
cat ~/.ssh/lite-swarm-deploy.pub | ssh <user>@<vm> \
  'install -m 700 -d ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

**2.3. Проверить, что новым ключом реально пускает и docker доступен:**

```bash
ssh -i ~/.ssh/lite-swarm-deploy -o IdentitiesOnly=yes <user>@<vm> \
  'docker info --format "{{.Swarm.ControlAvailable}}"'
# true
```

`-o IdentitiesOnly=yes` обязателен для проверки: без него ssh может молча
подойти вашим старым ключом, и вы решите, что новый работает.

Тот же путь целиком, как у CI:

```bash
DOCKER_HOST=ssh://<user>@<vm> GIT_SSH_COMMAND='ssh -i ~/.ssh/lite-swarm-deploy' \
  docker version --format '{{.Server.Version}}'
```

**2.4. Положить приватный ключ в секрет `SWARM_SSH_KEY`.**

В секрет идёт **содержимое файла целиком**, включая первую и последнюю строки:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
…
-----END OPENSSH PRIVATE KEY-----
```

Самый надёжный способ — не копировать руками:

```bash
# через gh (если установлен) — читает файл как есть
gh secret set SWARM_SSH_KEY --repo bmazurme/lite < ~/.ssh/lite-swarm-deploy

# либо в буфер обмена и вставить в форму GitHub
pbcopy < ~/.ssh/lite-swarm-deploy
```

Чего делать нельзя:

- **не** вставлять публичный ключ (`.pub`) — в секрет идёт приватный, без `.pub`;
- **не** склеивать в одну строку и не убирать переносы — формат построчный;
- **не** обрезать `-----BEGIN/END-----`;
- **не** класть ключ в формате PuTTY (`.ppk`) — нужен OpenSSH; конвертируйте
  через `puttygen key.ppk -O private-openssh -o key`.

Проверить, что файл валиден, перед вставкой:

```bash
ssh-keygen -y -f ~/.ssh/lite-swarm-deploy > /dev/null && echo "ключ читается"
```

**2.5. Заодно — `SWARM_SSH_KNOWN_HOSTS`.** Он пинит host key ВМ, чтобы раннер
не доверял первому встречному:

```bash
ssh-keyscan -t ed25519 <vm>
# вывод целиком (строка вида "<vm> ssh-ed25519 AAAA…") — в секрет
```

Секрет необязательный: без него джоб делает `ssh-keyscan` на каждом прогоне и
пишет warning. Но тогда это доверие «по факту первого подключения» на каждый
деплой — лучше запинить.

### Если деплой падает на SSH

| Симптом в логе джоба | Причина |
|---|---|
| `Permission denied (publickey)` | публичная половина не попала в `~/.ssh/authorized_keys` на ВМ, либо в секрет вставлен `.pub` вместо приватного |
| `Load key ...: error in libcrypto` / `invalid format` | ключ обрезан, склеен в строку или в формате PuTTY |
| `Enter passphrase for key` (джоб виснет) | ключ сгенерирован с паролем — перевыпустите с `-N ''` |
| `Host key verification failed` | `SWARM_SSH_KNOWN_HOSTS` от другого хоста или ВМ пересоздали (host key сменился) |
| `permission denied while trying to connect to the Docker daemon socket` | ключ рабочий, но пользователь не в группе `docker` на ВМ |

---

## Шаг 3. Прописать секреты в GitHub

`Settings → Secrets and variables → Actions → New repository secret` в
`bmazurme/lite`. Или через `gh` (если установлен):

```bash
gh secret set SWARM_HOST --repo bmazurme/lite --body '<vm>'
gh secret set SWARM_USER --repo bmazurme/lite --body '<user>'
gh secret set SWARM_SSH_KEY --repo bmazurme/lite < ~/.ssh/lite-swarm-deploy
gh secret set SWARM_SSH_KNOWN_HOSTS --repo bmazurme/lite --body "$(ssh-keyscan -t ed25519 <vm>)"
# …и далее по таблице
```

Полный список — в [README.md](README.md#секреты-github). Короткий чек-лист:

| Секрет | Откуда взять |
|---|---|
| `SWARM_HOST` | внешний адрес ВМ (тот, до которого достучится раннер) |
| `SWARM_USER` | SSH-пользователь |
| `SWARM_SSH_KEY` | приватный ключ из шага 2, **целиком**, вместе со строками `-----BEGIN/END-----` |
| `SWARM_SSH_KNOWN_HOSTS` | вывод `ssh-keyscan -t ed25519 <vm>` |
| `POSTGRES_HOST`, `MINIO_ENDPOINT`, `LOKI_HOST` | **приватный** IP ВМ — форматы ниже, они разные |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | из `/data/.env` |
| `JWT_SECRET`, `REFRESH_JWT_SECRET` | из `/data/.env`, **не менять** |
| `NOTES_YANDEX_ID/SECRET/REDIRECT`, `NOTES_TARGET_URL` | из `/data/.env` |
| `EMAILS`, `COOKIE_DOMAIN`, `CORS_ORIGINS` | из `/data/.env` |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | из `/data/.env` |

Уже существующие `YC_SA_JSON_CREDENTIALS`, `CR_HOST`, `CR_REGISTRY`,
`CR_IMAGE_CORE`, `CR_IMAGE_CLIENT`, `VITE_API_DOMAIN`, `VITE_TOKEN`,
`VITE_SITE_URL` трогать не нужно.

`POSTGRES_DB` — имя БД заметок (то, что core читает как `POSTGRES_DB_NOTES`).
Оно не секретное, поэтому может лежать и в `Actions → Variables`: workflow берёт
`secrets.POSTGRES_DB || vars.POSTGRES_DB`, сработает любой вариант. Убедитесь,
что это именно база заметок, а не значение `POSTGRES_DB` из `/data/.env`,
которым инициализируется сам контейнер postgres, — они могут отличаться.

### Адреса общих сервисов: postgres, minio, loki

Postgres, MinIO и Loki остаются в compose-стеке и в swarm-стек не входят.
Контейнеры стека сидят в своей overlay-сети и **не видят compose-имена**
(`postgres`, `minio`, `loki`) — ходить к ним нужно по адресу хоста, на котором
эти сервисы уже опубликовали порты.

Возьмите приватный IPv4 ВМ (шаг 0, `ip -4 route get 1.1.1.1`), дальше — пример
для `10.128.0.11`:

| Секрет | Значение | Формат |
|---|---|---|
| `POSTGRES_HOST` | `10.128.0.11` | голый хост, без схемы и порта |
| `POSTGRES_PORT` | `5432` | можно не задавать — дефолт в стеке |
| `MINIO_ENDPOINT` | `10.128.0.11` | **голый хост: без `http://`, без порта** |
| `MINIO_PORT` | `9000` | можно не задавать — дефолт `9000` |
| `MINIO_USE_SSL` | `false` | можно не задавать — дефолт `false` |
| `LOKI_HOST` | `http://10.128.0.11:3100` | **полный URL: со схемой и портом** |

Форматы у MinIO и Loki разные — это не опечатка, а разные клиенты:

- MinIO SDK принимает хост, порт и флаг TLS **раздельно**
  (`endPoint` / `port` / `useSSL` в `apps/core/src/uploads/uploads.service.ts`).
  Если положить в `MINIO_ENDPOINT` строку `http://10.128.0.11:9000`, клиент
  упадёт на разборе адреса — загрузка и отдача картинок перестанут работать.
- `winston-loki` принимает **URL целиком** (`host` в
  `apps/core/src/config/logger.config.ts`). Без схемы транспорт до Loki не соберётся:
  приложение при этом работает, просто логи не уезжают.

Проверить, что порты действительно опубликованы на хост:

```bash
ssh <user>@<vm> 'docker ps --format "{{.Names}}\t{{.Ports}}" | grep -E "postgres|minio|loki"'
# ожидаемо: 0.0.0.0:5432->5432/tcp, 0.0.0.0:9000->9000/tcp, 0.0.0.0:3100->3100/tcp
```

`bootstrap.sh` из шага 1 эти три адреса проверяет изнутри контейнера и печатает
готовые значения — можно просто скопировать их из его вывода.

Частая ошибка: `SWARM_HOST` = внутренний IP. Раннер GitHub ходит из интернета —
ему нужен внешний адрес. Внутренний идёт только в `POSTGRES_HOST`,
`MINIO_ENDPOINT` и `LOKI_HOST`.

---

## Шаг 4. Репетиция на запасных портах (без простоя)

Смысл: убедиться, что образы поднимаются и env подставлен верно, **пока прод
ещё работает на compose**. Порты в стеке параметризованы (`CORE_PORT`,
`CLIENT_PORT`), поэтому его можно поднять рядом на 3460/3465.

**4.1.** С ветки (ещё не смерженной в `main`) запустите
`Actions → Deploy to Yandex Cloud → Run workflow` и выберите свою ветку. Джобы
`push-core`/`push-client` соберут и запушат образы, а `deploy` пропустится —
у него `if: github.ref == 'refs/heads/main'`. Запомните SHA прогона.

**4.2.** Поднимите стек вручную на запасных портах:

```bash
export DOCKER_HOST=ssh://<user>@<vm>
export CORE_PORT=3460 CLIENT_PORT=3465
export CR_HOST=… CR_REGISTRY=… CR_IMAGE_CORE=… CR_IMAGE_CLIENT=… IMAGE_TAG=<sha из 4.1>
export POSTGRES_HOST=… POSTGRES_USER=… POSTGRES_PASSWORD=… POSTGRES_DB=…
export JWT_SECRET=… REFRESH_JWT_SECRET=… NOTES_TARGET_URL=… COOKIE_DOMAIN=… SITE_URL=…
export LOKI_HOST=… MINIO_ENDPOINT=… MINIO_ACCESS_KEY=… MINIO_SECRET_KEY=…

docker login cr.yandex        # разово, чтобы --with-registry-auth было что передать
docker stack deploy -c deploy/swarm/notes-stack.yml --with-registry-auth notes-rehearsal
```

**4.3.** Дождитесь `1/1` у обоих сервисов и проверьте:

```bash
docker stack ps notes-rehearsal
ssh <user>@<vm> '
  curl -sf http://127.0.0.1:3460/api/v1/types | head -c 200; echo
  curl -sf -o /dev/null -w "front %{http_code}\n" http://127.0.0.1:3465/
  curl -sf -o /dev/null -w "rss   %{http_code}\n" http://127.0.0.1:3465/rss.xml
  curl -sf -A "TelegramBot" http://127.0.0.1:3465/n/<любой-существующий-slug> | grep -c "og:title"
'
```

Последняя строка (`1`) проверяет, что жив пререндер для мессенджеров: nginx
увидел ботовый User-Agent и сходил в core за OG-разметкой.

Если что-то не поднялось:

```bash
docker service ps --no-trunc notes-rehearsal_notes-core
docker service logs --tail 100 notes-rehearsal_notes-core
```

Типичное: `POSTGRES_HOST` указывает на `postgres` вместо IP хоста, или в
секрете внешний IP вместо внутреннего.

**4.4.** Снимите репетиционный стек — иначе он будет держать лишние порты и
ресурсы:

```bash
docker stack rm notes-rehearsal
```

---

## Шаг 5. Окно простоя: освободить порты

Здесь начинается недоступность приложения.

**5.1.** В `bmazurme/ntlstl.place.api` удалите из `yc/main/docker-compose.yaml`
целиком два сервиса:

```yaml
  notes-core:
    image: cr.yandex/crpfap56bqr8nkph7d9g/notes-core:latest
    container_name: notes-core
    networks:
      - internet
    env_file:
      - /data/.env
    ports:
      - 3450:3000
    depends_on:
      - postgres
    restart: unless-stopped

  notes-client:
    image: cr.yandex/crpfap56bqr8nkph7d9g/notes-client:latest
    ports:
      - 3455:80
    depends_on:
      - notes-core
    networks:
      - internet
    restart: unless-stopped
```

`container_name: notes-core` уходит вместе с сервисом — это важно: пока имя
занято, swarm-задача с тем же hostname будет конфликтовать в docker DNS на
хосте.

**5.2.** Смержите в `main` и дождитесь, пока деплой того репозитория пересоберёт
метаданные ВМ и перезапустит монолит. Проверьте, что порты освободились:

```bash
ssh <user>@<vm> 'docker ps --format "{{.Names}}\t{{.Ports}}" | grep -E "3450|3455" || echo "порты свободны"'
```

---

## Шаг 6. Поднять swarm-стек

Смержите в `main` этого репозитория ветку с `deploy/swarm/` — пуш в `main`
запустит `Deploy to Yandex Cloud` целиком: соберутся и запушатся образы, затем
джоб `deploy` выполнит `docker stack deploy` на штатных 3450/3455.

Если ветка уже смержена, просто перезапустите workflow:
`Actions → Deploy to Yandex Cloud → Run workflow → main`.

Джоб сам дожидается сходимости rolling update и прогоняет smoke-тест по
3450/3455 с самой ВМ. Зелёный `deploy` = приложение поднялось.

---

## Шаг 7. Проверки

С ВМ:

```bash
ssh <user>@<vm> '
  docker stack ps notes
  curl -sf -o /dev/null -w "api   %{http_code}\n" http://127.0.0.1:3450/api/v1/types
  curl -sf -o /dev/null -w "front %{http_code}\n" http://127.0.0.1:3455/
  curl -sf -o /dev/null -w "rss   %{http_code}\n" http://127.0.0.1:3455/rss.xml
'
```

Снаружи, на публичном домене:

- открыть сайт, залогиниться через Яндекс (проверяет OAuth и что JWT-секреты
  перенесены верно — если разлогинило всех, секреты не те);
- открыть любую заметку, загрузить картинку (проверяет MinIO);
- `/rss.xml` и `/sitemap.xml` отдают XML.

**Превью ссылок в мессенджерах** — то, ради чего нужен пререндер:

```bash
curl -s -A 'TelegramBot (like TwitterBot)' https://<домен>/n/<slug> \
  | grep -E '<title>|og:title|og:image|og:type'
```

Должны прийти теги конкретной заметки (`og:type` = `article`), а не дефолтная
мета сайта. Затем — живая проверка: отправьте ссылку на заметку себе в
Telegram/VK и убедитесь, что карточка с заголовком и картинкой собирается.
Если превью закэшировалось старое, сбросьте его в
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) или
[VK Share](https://vk.com/dev/pages.clearCache).

Логи первых минут:

```bash
DOCKER_HOST=ssh://<user>@<vm> docker service logs --tail 200 -f notes_notes-core
```

---

## Грабли: ingress swarm слушает только IPv4

**Симптом.** Стек поднялся, `docker service ls` показывает `1/1`, с ВМ
`curl http://127.0.0.1:3450/...` отвечает 200 — а публичный домен отдаёт то 200,
то таймаут, примерно через раз. В `/var/log/nginx/error.log` на ВМ:

```
connect() failed (111) while connecting to upstream, upstream: "http://[::1]:3455/"
no live upstreams while connecting to upstream, upstream: "http://localhost/"
```

**Причина.** Compose публиковал порты в обе стороны — в `docker ps` было
`0.0.0.0:3450->3000/tcp, :::3450->3000/tcp`. Ingress-сеть swarm публикует
**только IPv4**. А nginx на ВМ проксирует на `http://localhost:3450`, где
`localhost` резолвится сразу в два адреса — `127.0.0.1` и `::1`. Nginx считает
это апстрим-группой из двух серверов и балансирует между ними: половина
запросов уходит в `[::1]:3450`, соединение не устанавливается, апстрим
помечается мёртвым — и следующие запросы получают `no live upstreams` уже на
обоих адресах.

Пока приложение жило в compose, оба адреса отвечали, и разницы не было видно.
Перевод в swarm ломает ровно эту половину.

**Проверка** (с ВМ):

```bash
for t in 127.0.0.1 localhost '[::1]'; do
  printf '%-12s %s\n' "$t" "$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://$t:3450/api/v1/types)"
done
# 127.0.0.1    200
# localhost    200      ← обманчиво: curl взял первый адрес из списка
# [::1]        000      ← вот оно
```

**Фикс** — прибить апстрим к IPv4 в vhost'ах, которые смотрят на swarm-порты:

```bash
sudo cp /etc/nginx/sites-available/notes.ntlstl.dev{,.bak}
sudo sed -i 's|proxy_pass http://localhost:|proxy_pass http://127.0.0.1:|' \
  /etc/nginx/sites-available/notes.ntlstl.dev \
  /etc/nginx/sites-available/notes-core.ntlstl.dev
sudo nginx -t && sudo systemctl reload nginx
```

Проверять после фикса надо **серией** запросов, а не одним: при балансировке
между двумя адресами единичный 200 ничего не доказывает.

```bash
for i in $(seq 1 15); do
  printf '%s ' "$(curl -s -m 8 -o /dev/null -w '%{http_code}' https://notes.ntlstl.dev/)"
done
# ожидаемо: 200 ×15
```

Тот же фикс нужен любому другому сервису на этой ВМ, который уже переехал в
swarm (`rain.ntlstl.dev`, `rain-api.ntlstl.dev`). Vhost'ы сервисов, оставшихся в
compose, трогать не обязательно — у них слушают оба стека, — но перевести их на
`127.0.0.1` тоже не повредит.

## Откат

**На шагах 0–4** откатывать нечего: прод не тронут. Достаточно
`docker stack rm notes-rehearsal`, если репетиционный стек ещё жив.

**Если сломалось на шаге 6** (стек не поднимается, а порты уже отданы) —
самый быстрый путь назад: вернуть коммит в `ntlstl.place.api`
(`git revert` + мерж в `main`) и дождаться деплоя того репозитория. Compose
поднимет `notes-core`/`notes-client` из `:latest` как раньше. Перед этим
снимите swarm-стек, иначе он будет держать порты:

```bash
DOCKER_HOST=ssh://<user>@<vm> docker stack rm notes
```

**Если сломался уже работающий стек после очередного деплоя** — откат на
предыдущий образ, без участия CI:

```bash
export DOCKER_HOST=ssh://<user>@<vm>
docker service rollback notes_notes-core
docker service rollback notes_client
```

Swarm и сам откатывается: если новая задача не проходит healthcheck в окне
`monitor`, срабатывает `failure_action: rollback`, а джоб `deploy` падает с
`failed to update and swarm rolled it back`.

---

## После переключения

- `/data/.env` на ВМ остаётся (он общий с другими сервисами монолита), но
  notes-ключи в нём больше не читаются. Не удаляйте сразу — это резервная копия
  значений, пока не убедитесь, что всё работает.
- Дальше деплой — обычный пуш в `main`. Каждый прогон катит конкретный
  `:<sha>` с rolling update и авто-откатом; ручных действий на ВМ не требуется.
- Если ВМ когда-нибудь пересоздадут — swarm-состояние живёт в `/var/lib/docker`
  и пересоздания не переживёт. Повторите шаг 1.
