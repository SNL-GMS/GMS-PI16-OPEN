ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./mock-workflow-manager/bin
COPY lib ./mock-workflow-manager/lib

WORKDIR mock-workflow-manager

# Define default command.
CMD ["./bin/mock-workflow-manager"]

HEALTHCHECK --interval=30s --start-period=180s --retries=10 \
  CMD curl -f localhost:8080/mock-workflow-manager/alive || exit 1

