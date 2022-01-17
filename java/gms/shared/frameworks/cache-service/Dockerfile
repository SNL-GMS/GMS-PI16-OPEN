ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./cache-service/bin
COPY lib ./cache-service/lib

WORKDIR cache-service/bin/visor

ARG IGNITE_HOME=/opt/gms/cache-service

#Copy in our init scripts
COPY config/ian-kube-discovery.xml /opt/gms/cache-service/config/ian-kube-discovery.xml
COPY config/soh-kube-discovery.xml /opt/gms/cache-service/config/soh-kube-discovery.xml

# script to start visor, since users could inadvertently start a new Ignite node
COPY visor.sh /opt/gms/cache-service/bin/visor/visor.sh
RUN set -ex && \
    chmod +x /opt/gms/cache-service/bin/visor/visor.sh

ENV PATH="/opt/gms/cache-service/bin/visor:${PATH}"

#Running the jar in the docker container
ENTRYPOINT ["/opt/gms/cache-service/bin/cache-service"]

HEALTHCHECK --interval=30s \
  CMD curl -f localhost:8080/cache-service/alive \
    || exit 1