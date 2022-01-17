ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM $DOCKER_REGISTRY/$PROJECT_NAME/centos:$DOCKER_IMAGE_TAG

ARG NODE_YUM_URL=https://rpm.nodesource.com
ARG NODE_MAJOR_VERSION=10
ARG NODEJS_VERSION=10.19.0

COPY src/NODESOURCE-GPG-SIGNING-KEY-EL /etc/pki/rpm-gpg/NODESOURCE-GPG-SIGNING-KEY-EL
COPY src/nodesource-el7.repo /etc/yum.repos.d/nodesource-el7.repo

RUN set -ex && \
    sed -i -e "s~#NODE_YUM_URL#~$NODE_YUM_URL~g" /etc/yum.repos.d/nodesource-el7.repo && \
    sed -i -e "s~#NODE_MAJOR_VERSION#~$NODE_MAJOR_VERSION~g" /etc/yum.repos.d/nodesource-el7.repo && \
    yum -y install nodejs-$NODEJS_VERSION && \
    yum clean all

CMD ["/bin/bash"]