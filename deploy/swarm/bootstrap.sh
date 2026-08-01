#!/usr/bin/env bash
#
# One-time preparation of the deploy target: turns the existing VM into a
# single-node swarm manager standing next to the compose stack that is already
# running there, and checks the things the notes stack depends on.
#
# Run it on the VM (not from CI):
#
#   scp deploy/swarm/bootstrap.sh <user>@<vm>:~/ && ssh <user>@<vm> 'bash ~/bootstrap.sh'
#
# It is idempotent — re-running it on a node that is already a manager only
# re-prints the checks. It never touches the compose stack.
set -euo pipefail

CORE_PORT=3450
NGINX_PORT=3455
POSTGRES_PORT=${POSTGRES_PORT:-5432}
MINIO_PORT=${MINIO_PORT:-9000}
LOKI_PORT=${LOKI_PORT:-3100}

info() { printf '\033[0;36m==>\033[0m %s\n' "$1"; }
warn() { printf '\033[0;33m[!]\033[0m %s\n' "$1"; }
fail() {
  printf '\033[0;31m[x]\033[0m %s\n' "$1" >&2
  exit 1
}

command -v docker >/dev/null || fail 'docker not found on this host'

# Address the swarm advertises and, more importantly, the address the stack's
# containers will use to reach the compose stack's postgres/minio/loki: those
# are published on the host, so containers need a host address, not "postgres".
HOST_IP=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
[ -n "${HOST_IP:-}" ] || fail 'could not determine the primary IPv4 address of this host'

info "Host address: ${HOST_IP}"

# --- swarm -------------------------------------------------------------------
SWARM_STATE=$(docker info --format '{{.Swarm.LocalNodeState}}')
if [ "$SWARM_STATE" = 'active' ]; then
  info "Swarm already active (node is $(docker info --format '{{if .Swarm.ControlAvailable}}manager{{else}}worker{{end}}'))"
else
  info "Initialising swarm on ${HOST_IP}"
  docker swarm init --advertise-addr "$HOST_IP"
fi

docker info --format '{{.Swarm.ControlAvailable}}' | grep -q true ||
  fail 'this node is not a swarm manager — the stack deploy expects a manager here'

# --- port availability -------------------------------------------------------
# The reverse proxy points at 3450/3455, so the swarm stack takes them over from
# the compose stack. Both cannot hold them at once.
for port in "$CORE_PORT" "$NGINX_PORT"; do
  if ss -ltn "sport = :${port}" 2>/dev/null | grep -q LISTEN; then
    warn "port ${port} is still in use — most likely notes-core/notes-client"
    warn 'in the compose stack. Remove them from'
    warn 'ntlstl.place.api/yc/main/docker-compose.yaml and let that deploy run'
    warn 'before deploying this stack, otherwise the swarm task cannot bind.'
  else
    info "port ${port} is free"
  fi
done

# --- shared services reachable from inside a container -----------------------
# The stack reaches postgres/minio/loki through the host address, not through
# compose service names, so the check has to run from inside a container too.
check_from_container() {
  local name=$1 port=$2
  info "Checking ${name} at ${HOST_IP}:${port} from inside a container"
  if docker run --rm alpine:3.20 sh -c "nc -z -w 3 ${HOST_IP} ${port}"; then
    info "${name} is reachable"
  else
    warn "${name} is NOT reachable at ${HOST_IP}:${port} from a container."
    warn "Check that the compose ${name} still publishes ${port} on the host."
  fi
}

check_from_container postgres "$POSTGRES_PORT"
check_from_container minio "$MINIO_PORT"
check_from_container loki "$LOKI_PORT"

cat <<EOF

Done. Set these GitHub secrets in bmazurme/lite so the deploy job can reach
this node:

  SWARM_HOST         ${HOST_IP}   # or the VM's public address, if CI connects over the internet
  SWARM_USER         $(whoami)
  SWARM_SSH_KEY      <private key whose public half is in ~/.ssh/authorized_keys here>
  SWARM_SSH_KNOWN_HOSTS
$(ssh-keyscan -t ed25519 "$HOST_IP" 2>/dev/null | sed 's/^/                     /')
  POSTGRES_HOST      ${HOST_IP}
  MINIO_ENDPOINT     ${HOST_IP}
  LOKI_HOST          http://${HOST_IP}:${LOKI_PORT}

Registry credentials are pushed from the runner with --with-registry-auth, so
this node does not need its own docker login to cr.yandex.
EOF
