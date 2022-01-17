# Run CD1.1 RSDF processing topology

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /acei-merge-processor/

COPY bin ./acei-merge-processor/bin
COPY lib ./acei-merge-processor/lib

RUN set -ex && \
    chgrp -R 0 /acei-merge-processor && \
    chmod -R g=u /acei-merge-processor && \
    chmod -R g+s /acei-merge-processor

# Start topology
CMD acei-merge-processor/bin/acei-merge-processor

HEALTHCHECK --interval=30s --retries=10 \
 CMD curl -f localhost:8080/acei-merge-processor/alive || exit 1
