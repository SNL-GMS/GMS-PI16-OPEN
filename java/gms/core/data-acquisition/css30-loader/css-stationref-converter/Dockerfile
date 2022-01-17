ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
FROM $DOCKER_REGISTRY/gms-common/java:$DOCKER_IMAGE_TAG

WORKDIR /css-stationref-converter/

COPY Metadata ./css-root
COPY bin ./css-stationref-converter/bin
COPY lib ./css-stationref-converter/lib

RUN set -ex && \
    chgrp -R 0 /css-stationref-converter && \
    chmod -R g=u /css-stationref-converter && \
    chmod -R o=u /css-stationref-converter && \
    chmod -R g+s /css-stationref-converter

ENTRYPOINT ["./css-stationref-converter/bin/css-stationref-converter"]
