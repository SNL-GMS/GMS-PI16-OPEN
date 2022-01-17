ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/centos:${DOCKER_IMAGE_TAG}

ARG PG_EXPORTER_VERSION=0.8.0
ARG GITHUB_URL=https://github.com

RUN set -ex && \
    curl -fOL ${GITHUB_URL}/wrouesnel/postgres_exporter/releases/download/v${PG_EXPORTER_VERSION}/postgres_exporter_v${PG_EXPORTER_VERSION}_linux-amd64.tar.gz && \
    tar -xvf postgres_exporter_v${PG_EXPORTER_VERSION}_linux-amd64.tar.gz && \
    mv postgres_exporter_v${PG_EXPORTER_VERSION}_linux-amd64/postgres_exporter /bin && \
    rm -rf postgres_exporter_v${PG_EXPORTER_VERSION}_linux-amd64.tar.gz postgres_exporter_v${PG_EXPORTER_VERSION}_linux-amd64 && \
    useradd -r postgres_exporter

EXPOSE 9187

USER postgres_exporter

HEALTHCHECK --interval=30s \
  CMD curl -f localhost:9187 \
    || exit 1

ENTRYPOINT [ "/bin/postgres_exporter" ]
