#
#  Dockerfile to make a 'alive-tests' image for GMS.
#

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/python:${DOCKER_IMAGE_TAG}

COPY scripts/run-alive-tests .

ENV GMS_APP=soh

CMD ["./run-alive-tests" ]

