ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/centos:${DOCKER_IMAGE_TAG}

COPY src/register.sh /register.sh
COPY src/unregister.sh /unregister.sh

ENTRYPOINT ["/register.sh"]
