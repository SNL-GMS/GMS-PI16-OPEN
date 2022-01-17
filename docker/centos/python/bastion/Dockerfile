#
#  Dockerfile to make a 'bastion' image for GMS.
#
#  This is a container usable for system maintenance and diagnostics.
#
#  docker exec -it [ bastion image id ] /bin/bash
#

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/python:${DOCKER_IMAGE_TAG}

ARG LIBRDKAFKA_VERSION=1.3.0
ARG KAFKACAT_VERSION=1.5.0
ARG GITHUB_URL=https://github.com
ARG ORACLE_URL=https://download.oracle.com

ENV LD_LIBRARY_PATH="/usr/lib/oracle/18.5/client64/lib"
ENV PATH="/usr/lib/oracle/18.5/client64/bin:${PATH}"

WORKDIR /bastion

RUN set -ex && \
    yum -y install gcc-c++ cmake openssl postgresql bind-utils tcpdump net-tools etcd && \
    # build librdkafka
    curl -fOL ${GITHUB_URL}/edenhill/librdkafka/archive/v${LIBRDKAFKA_VERSION}.tar.gz && \
    tar -xzf v${LIBRDKAFKA_VERSION}.tar.gz && \
    cd librdkafka-${LIBRDKAFKA_VERSION} && \
    ./configure && \
    make && \
    make install && \
    cd .. && \
    rm -rf v${LIBRDKAFKA_VERSION}.tar.gz librdkafka-${LIBRDKAFKA_VERSION} && \
    # build kafkacat (now called kcat)
    curl -fOL ${GITHUB_URL}/edenhill/kafkacat/archive/${KAFKACAT_VERSION}.tar.gz && \
    tar -xzf ${KAFKACAT_VERSION}.tar.gz && \
    cd kcat-${KAFKACAT_VERSION} && \
    LDFLAGS="-pthread -lm -ldl" ./configure --enable-static --enable-json && \
    make && \
    make install && \
    cd .. && \
    rm -rf ${KAFKACAT_VERSION}.tar.gz kcat-${KAFKACAT_VERSION} && \
    # install oracle instant client
    curl -fOL ${ORACLE_URL}/otn_software/linux/instantclient/185000/oracle-instantclient18.5-basic-18.5.0.0.0-3.x86_64.rpm && \
    curl -fOL ${ORACLE_URL}/otn_software/linux/instantclient/185000/oracle-instantclient18.5-sqlplus-18.5.0.0.0-3.x86_64.rpm && \
    yum -y localinstall oracle-instantclient*.rpm && \
    rm -rf oracle-instantclient*.rpm && \
    # cleanup
    yum -y remove gcc-c++ cmake && \
    yum clean all

ENV ETCDCTL_API=3

# If we are running, we are healthy
HEALTHCHECK CMD ps -o args -p 1 | grep sleep

# Run in the background forever.
# System maintainers should `docker exec -it [ bastion image id ] /bin/bash` to access
CMD ["/bin/sleep", "infinity"]
