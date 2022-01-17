ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./mock-waveform-application/bin
COPY lib ./mock-waveform-application/lib

WORKDIR mock-waveform-application

# Define default command.
CMD ["./bin/mock-waveform-application"]

HEALTHCHECK --interval=30s --start-period=180s --retries=10 \
  CMD curl -f localhost:8080/mock-waveform-application/alive || exit 1

