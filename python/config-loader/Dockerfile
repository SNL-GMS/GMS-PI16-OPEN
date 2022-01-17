ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/python:${DOCKER_IMAGE_TAG}

EXPOSE 8080

WORKDIR /config-loader

SHELL [ "/bin/bash", "-l", "-c" ]

COPY ./setup.py /config-loader/setup.py
COPY ./app /config-loader/app
COPY ./gunicorn-config.py /config-loader/gunicorn-config.py
COPY ./_python/gms-data-loader /install/gms-data-loader

RUN set -ex && \
    mkdir /override && \
    mkdir /config-loader/app/state && \
    cd /install/gms-data-loader && python3 setup.py install && \
    cd /config-loader && python3 setup.py install

# copy the config data last to maximize docker cache hits
COPY ./_config /base

HEALTHCHECK --interval=30s CMD curl -f localhost:8080/alive || exit 1

ENTRYPOINT ["gunicorn", "--config=gunicorn-config.py", "app"]
