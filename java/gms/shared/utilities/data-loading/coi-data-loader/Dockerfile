ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

COPY bin ./coi-data-loader/bin
COPY lib ./coi-data-loader/lib

WORKDIR coi-data-loader

# Define default command.
CMD ["./bin/coi-data-loader"]

