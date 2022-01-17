ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./frameworks-osd-rsdf-kafka-consumer/bin
COPY lib ./frameworks-osd-rsdf-kafka-consumer/lib

HEALTHCHECK --interval=30s CMD ps -o args -p 1 | grep java | grep frameworks-osd-rsdf-kafka-consumer

WORKDIR frameworks-osd-rsdf-kafka-consumer

#Running the jar in the docker container
CMD ["./bin/frameworks-osd-rsdf-kafka-consumer"]

