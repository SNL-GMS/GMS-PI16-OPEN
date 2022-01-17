ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./smds-application/bin
COPY lib ./smds-application/lib

WORKDIR smds-application

# Define default command.
CMD ["./bin/smds-application"]

HEALTHCHECK --interval=30s --start-period=90s --retries=10 \
  CMD curl -f localhost:8080/smds-service/alive || exit 1

