ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /opt/gms

EXPOSE 8080

COPY bin ./frameworks-data-injector/bin
COPY lib ./frameworks-data-injector/lib

WORKDIR frameworks-data-injector

#Running the jar in the docker container
ENTRYPOINT ["./bin/frameworks-data-injector"]
