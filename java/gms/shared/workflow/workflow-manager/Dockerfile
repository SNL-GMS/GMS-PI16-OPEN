ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./workflow-manager/bin
COPY lib ./workflow-manager/lib

WORKDIR workflow-manager

# Define default command.
CMD ["./bin/workflow-manager"]

HEALTHCHECK --interval=30s --start-period=180s --retries=10 \
  CMD curl -f localhost:8080/workflow-manager-service/alive || exit 1

