# Run CD1.1 RSDF processing topology

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /cd11-rsdf-processor/

COPY bin ./cd11-rsdf-processor/bin
COPY lib ./cd11-rsdf-processor/lib

RUN set -ex && \
    chgrp -R 0 /cd11-rsdf-processor && \
    chmod -R g=u /cd11-rsdf-processor && \
    chmod -R g+s /cd11-rsdf-processor

# Start topology
CMD cd11-rsdf-processor/bin/cd11-rsdf-processor

HEALTHCHECK --interval=30s --retries=10 \
 CMD curl -f localhost:8080/cd11-rsdf-processor/alive || exit 1

