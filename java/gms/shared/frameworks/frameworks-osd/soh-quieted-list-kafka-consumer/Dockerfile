ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./soh-quieted-list-kafka-consumer/bin
COPY lib ./soh-quieted-list-kafka-consumer/lib

HEALTHCHECK --interval=30s CMD ps -o args -p 1 | grep java | grep soh-quieted-list-kafka-consumer

WORKDIR soh-quieted-list-kafka-consumer

#Running the jar in the docker container
CMD ["./bin/soh-quieted-list-kafka-consumer"]

