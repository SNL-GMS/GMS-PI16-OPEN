ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./capability-soh-rollup-kafka-consumer/bin
COPY lib ./capability-soh-rollup-kafka-consumer/lib

HEALTHCHECK --interval=30s CMD ps -o args -p 1 | grep java | grep capability-soh-rollup-kafka-consumer

WORKDIR capability-soh-rollup-kafka-consumer

#Running the jar in the docker container
CMD ["./bin/capability-soh-rollup-kafka-consumer"]