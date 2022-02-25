#!/bin/sh
set -e

# Check for NOT a kubernetes environment (i.e. must be swarm so access the secret)
if [ -z "${KUBERNETES_PORT}" ]; then
  if [ ! -r /run/secrets/ldap_proxy-logging-env.sh ]; then
    echo "ERROR: ldap_proxy environment file(/run/secrets/ldap_proxy-logging-env.sh) not loaded as a secret" 1>&2
    exit 1
  fi

  source /run/secrets/ldap_proxy-logging-env.sh
fi

exec "$@"
