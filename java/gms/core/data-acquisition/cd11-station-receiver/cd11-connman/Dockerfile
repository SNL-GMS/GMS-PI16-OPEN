# Docker build arguments
ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /data-receiver/

RUN set -ex && \
    # connman needs the `host` command to resolve hostnames in a Fortify-friendly way
    yum -y install bind-utils && \
    yum clean all && \
    mkdir -p shared-volume/logs && \
    chmod -R 777 shared-volume/

COPY bin ./cd11-connman/bin
COPY lib ./cd11-connman/lib

CMD cd11-connman/bin/cd11-connman

HEALTHCHECK --interval=30s --retries=10 \
 CMD curl -f localhost:8080/da-connman/alive || exit 1
