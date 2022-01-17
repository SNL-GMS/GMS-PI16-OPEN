ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

COPY bin ./tools-station-ref-builder/bin
COPY lib ./tools-station-ref-builder/lib
#
WORKDIR tools-station-ref-builder

# Define default command.
CMD ["./bin/tools-station-ref-builder"]

