# Run cd11-data-provider

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /cd11-data-provider/

# Copy in the CD1.1 RSDF data and configuration
COPY cd11-test-data /rsdf/cd11/
COPY conf /rsdf/cd11/

COPY bin ./cd11-data-provider/bin
COPY lib ./cd11-data-provider/lib

RUN set -ex && \
    chgrp -R 0 /cd11-data-provider && \
    chmod -R g=u /cd11-data-provider && \
    chmod -R g+s /cd11-data-provider

# This script will set the CD11_INJECTOR_CONFIG_PATH and run the cd11-data-provider
CMD export GMS_CONFIG_CD11_DATA_PROVIDER__CONFIG_PATH=/rsdf/cd11/${CD11_INJECTOR_CONFIG_NAME}-config.json && cd11-data-provider/bin/cd11-data-provider

