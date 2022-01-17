ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./station-definition-application/bin
COPY lib ./station-definition-application/lib

WORKDIR station-definition-application

# Define default command.
CMD ["./bin/station-definition-application"]

HEALTHCHECK --interval=30s --start-period=180s --retries=10 \
  CMD curl -f localhost:8080/station-definition-service/alive || exit 1

