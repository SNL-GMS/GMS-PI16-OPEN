ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./soh-status-change-kafka-consumer/bin
COPY lib ./soh-status-change-kafka-consumer/lib

HEALTHCHECK --interval=30s CMD ps -o args -p 1 | grep java | grep soh-status-change-kafka-consumer

WORKDIR soh-status-change-kafka-consumer

#Running the jar in the docker container
CMD ["./bin/soh-status-change-kafka-consumer"]

