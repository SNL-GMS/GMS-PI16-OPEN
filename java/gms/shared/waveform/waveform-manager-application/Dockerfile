ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./waveform-manager-application/bin
COPY lib ./waveform-manager-application/lib

WORKDIR waveform-manager-application

HEALTHCHECK --interval=5s --timeout=10s --retries=10 \
 CMD curl -sfm 30 localhost:8080/waveform-manager-service/alive || exit 1

# Define default command.
CMD ["./bin/waveform-manager-application"]

