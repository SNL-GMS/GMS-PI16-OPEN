ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/python:$DOCKER_IMAGE_TAG

ENV PYTHONUNBUFFERED=1

WORKDIR /gms-data-loader
COPY . /gms-data-loader

RUN set -ex && \
    python3 setup.py install

ARG CI_VERSION=NA

ENV CI_VERSION=${CI_VERSION}

LABEL gms.ci.version=${CI_VERSION}

ENTRYPOINT ["gms-data-loader.py"]
