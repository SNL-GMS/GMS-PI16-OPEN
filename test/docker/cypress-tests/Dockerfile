#
#  Dockerfile to make a 'cypress-test' image for GMS.
#

ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/builder:${DOCKER_IMAGE_TAG}

# firefox
ARG FIREFOX_VERSION=68.12.0esr
ARG MOZILLA_URL=http://ftp.mozilla.org

RUN set -ex && \
    # yum requirements
    yum install -y alsa-lib \
                   GConf2 \
                   gtk2-devel \
                   gtk3-devel \
                   libnotify-devel \
                   libXScrnSaver \
                   nss \
                   xorg-x11-server-Xvfb && \
    # install cypress - note the download mirror is configured inside the builder image
    yarn global add cypress@6.3.0 -W && \
    yarn global add mochawesome-merge@4.2.0 -W && \
    # install firefox
    curl -fOL ${MOZILLA_URL}/pub/firefox/releases/${FIREFOX_VERSION}/linux-x86_64/en-US/firefox-${FIREFOX_VERSION}.tar.bz2 && \
    tar xvjf firefox-${FIREFOX_VERSION}.tar.bz2 && \
    mv ./firefox /usr/local && \
    ln -s /usr/local/firefox/firefox /usr/bin/firefox && \
    rm -f firefox-${FIREFOX_VERSION}.tar.bz2 && \
    # cleanup
    yum clean all

COPY ./_user-interface /user-interface
COPY ./scripts/run-cypress-tests /user-interface/packages/cypress-tests/run-cypress-tests

WORKDIR /user-interface/packages/cypress-tests

CMD ["./run-cypress-tests"]
