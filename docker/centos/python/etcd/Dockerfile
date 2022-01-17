#
#  Dockerfile to make a configured etcd image for GMS.
#
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/python:$DOCKER_IMAGE_TAG

# Configure a single-node etcd server.  ETCD_NAME is definied
# in a separate ENV statement so that it can be interpolated
# later when setting ETCD_INITIAL_CLUSTER.
ENV ETCD_NAME=etcd1
ENV USER_NAME=etcd \
    ETCDCTL_API=3 \
    ETCD_DATA_DIR=/var/lib/etcd \
    ETCD_INITIAL_ADVERTISE_PEER_URLS=http://127.0.0.1:2380 \
    ETCD_LISTEN_PEER_URLS=http://0.0.0.0:2380 \
    ETCD_ADVERTISE_CLIENT_URLS=http://127.0.0.1:2379 \
    ETCD_LISTEN_CLIENT_URLS=http://0.0.0.0:2379 \
    ETCD_INITIAL_CLUSTER="${ETCD_NAME}=http://127.0.0.1:2380"

RUN set -ex && \
    # Install etcd
    yum -y install etcd && \
    yum clean all && \
    # Setup group-write permissions on data directory and /etc/passwd
    mkdir -p ${ETCD_DATA_DIR} && \
    chgrp -R 0 ${ETCD_DATA_DIR} /etc/passwd && \
    chmod -R g=u ${ETCD_DATA_DIR} /etc/passwd

WORKDIR /

# Copy in the the health-check.sh script
COPY src/etcd-entrypoint.sh /usr/local/bin/etcd-entrypoint.sh
COPY src/etcd-healthcheck.sh /usr/local/bin
# copy gms-sysconfig Python interface
COPY src/_python/gms-sysconfig /setup/gms-sysconfig
# Copy in the the system configuration files
COPY src/_config/system/* /setup/config/system/
# Copy in the the etcd setup script and set up etcd
COPY src/etcd-setup.sh /usr/local/bin/etcd-setup.sh

RUN set -ex && \
    # Install gms-sysconfig
    pip install /setup/gms-sysconfig && \
    # run setup script
    /usr/local/bin/etcd-setup.sh

HEALTHCHECK --interval=30s --timeout=30s --retries=5 CMD etcd-healthcheck.sh || exit 1

CMD ["etcd-entrypoint.sh", "etcd"]
