ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./ui-processing-configuration-service/bin
COPY lib ./ui-processing-configuration-service/lib

WORKDIR ui-processing-configuration-service

HEALTHCHECK --interval=30s --retries=10 \
 CMD curl -sfm 30 localhost:8080/ui-processing-configuration-service/alive || exit 1

# Define default command.
CMD ["./bin/ui-processing-configuration-service"]

