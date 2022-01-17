ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./signal-detection-application/bin
COPY lib ./signal-detection-application/lib

WORKDIR signal-detection-application

# Define default command.
CMD ["./bin/signal-detection-application"]

HEALTHCHECK --interval=30s --start-period=180s --retries=10 \
  CMD curl -f localhost:8080/signal-detection-application/alive || exit 1

