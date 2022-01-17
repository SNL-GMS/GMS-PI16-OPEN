ARG FROM_IMAGE
FROM ${FROM_IMAGE}

# centos base
ARG CENTOS_YUM_URL=http://mirror.centos.org/centos/
ARG EPEL_YUM_URL=https://mirrors.fedoraproject.org/pub/epel
# conda
ARG MINICONDA_URL=https://repo.anaconda.com
ARG ANACONDA_REPO_URL=https://conda.anaconda.org
ARG MINICONDA_VERSION=4.7.12.1
ARG MINICONDA_INSTALL_DIR=/usr/local/miniconda
# pip
ARG PYPI_URL=https://files.pythonhosted.org
ENV PIP_INDEX_URL=${PYPI_URL}
ENV PIP_NO_CACHE_DIR=1
ENV PIP_NO_COMPILE=1
# python
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONOTWRITEBYTECODE=1
ENV REQUESTS_CA_BUNDLE=/etc/pki/tls/certs/ca-bundle.crt
# gradle
ARG GRADLE_BASE_URL=https://downloads.gradle.org/
ARG GRADLE_VERSION=6.6.1
# java
ENV JAVA_HOME /usr/lib/jvm/java-11-openjdk
# sonarscanner
ARG SONAR_URL=https://binaries.sonarsource.com
ARG SONAR_SCANNER_VER=4.6.2.2472
# node
ARG NODEJS_FILES_URL=https://nodejs.org
ARG NODE_YUM_URL=https://rpm.nodesource.com
ARG NODE_MAJOR_VERSION=10
ARG NODEJS_VERSION=10.19.0
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG NPM_REGISTRY_STRICT_SSL=True
# yarn
ARG YARN_YUM_URL=https://dl.yarnpkg.com/rpm
ARG YARN_REGISTRY=https://registry.yarnpkg.com
# docker
ARG DOCKER_YUM_URL=https://download.docker.com
# electron
ARG ELECTRON_MIRROR=https://github.com/electron/electron/releases/download/v
ENV ELECTRON_MIRROR=${ELECTRON_MIRROR}
# cypress
ARG CYPRESS_DOWNLOAD_MIRROR=https://download.cypress.io
ENV CYPRESS_DOWNLOAD_MIRROR=${CYPRESS_DOWNLOAD_MIRROR}
ENV CYPRESS_CRASH_REPORTS=0
# docker-compose
ARG GITHUB_URL=https://github.com
ARG DOCKER_COMPOSE_VER=1.29.2
# kubectl
ARG GOOGLEAPIS_URL=https://storage.googleapis.com
ARG KUBECTL_VERSION=1.19.0
# helm
ARG HELM_URL=https://get.helm.sh
ARG HELM_VERSION=3.3.1
# minio client
ARG MINIO_URL=https://dl.min.io

# path
ENV PATH=${MINICONDA_INSTALL_DIR}/bin:${PATH}
# locale
ENV LANG="en_US.UTF-8"
ENV LANGUAGE="en_US.UTF-8"
ENV LC_ALL="en_US.UTF-8"

# Reset shell to source environment files and always use bash.
SHELL [ "/bin/bash", "-lc" ]

# copy all the things
COPY src/_centos/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo
COPY src/_centos/RPM-GPG-KEY-EPEL-7 /etc/pki/rpm-gpg/RPM-GPG-KEY-EPEL-7
COPY src/_centos/epel.repo /etc/yum.repos.d/epel.repo
COPY src/_python/condarc /root/.condarc.new
COPY src/_python/pydistutils.cfg /root/.pydistutils.cfg
COPY src/_python/environment.yml /root/environment.yml
COPY src/_python/gms-test-environment.yml /root/gms-test-environment.yml
COPY src/_typescript/NODESOURCE-GPG-SIGNING-KEY-EL /etc/pki/rpm-gpg/NODESOURCE-GPG-SIGNING-KEY-EL
COPY src/_typescript/nodesource-el7.repo /etc/yum.repos.d/nodesource-el7.repo
COPY src/yarn.repo /etc/yum.repos.d/yarn.repo
COPY src/npmrc /usr/etc/npmrc
COPY src/docker-ce.repo /etc/yum.repos.d/docker-ce.repo

RUN set -ex && \
    # configure yum
    echo "ip_resolve=4" >> /etc/yum.conf && \
    echo "skip_missing_names_on_install=0" >> /etc/yum.conf && \
    # setup yum repos
    sed -i -e "s~#CENTOS_YUM_URL#~${CENTOS_YUM_URL}~" /etc/yum.repos.d/CentOS-Base.repo && \
    sed -i -e "s~#EPEL_YUM_URL#~${EPEL_YUM_URL}~g" /etc/yum.repos.d/epel.repo && \
    sed -i -e "s~#DOCKER_YUM_URL#~${DOCKER_YUM_URL}~g" /etc/yum.repos.d/docker-ce.repo && \
    sed -i -e "s~#NODE_YUM_URL#~${NODE_YUM_URL}~g" /etc/yum.repos.d/nodesource-el7.repo && \
    sed -i -e "s~#NODE_MAJOR_VERSION#~${NODE_MAJOR_VERSION}~g" /etc/yum.repos.d/nodesource-el7.repo && \
    sed -i -e "s~#YARN_YUM_URL#~${YARN_YUM_URL}~g" /etc/yum.repos.d/yarn.repo && \
    # install yum requirements
    yum -y update && \
    yum install -y bzip2 \
                   ca-certificates \
                   curl \
                   docker-ce-cli \
                   gcc-c++ \
                   gettext \
                   git \
                   java-11-openjdk-devel.x86_64 \
                   jq \
                   less \
                   make \
                   nodejs-${NODEJS_VERSION} \
                   perl \
                   postgresql-devel \
                   unzip \
                   which \
                   yarn \
                   yum-plugin-versionlock && \
    # setup locale
    localedef -i en_US -f UTF-8 en_US.UTF-8 && \
    echo "LANG=\"en_US.UTF-8\"" > /etc/locale.conf && \
    # install miniconda/python
    curl -fOL ${MINICONDA_URL}/miniconda/Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh && \
    bash Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh -b -p ${MINICONDA_INSTALL_DIR} && \
    rm -f Miniconda3-${MINICONDA_VERSION}-Linux-x86_64.sh && \
    ln -s ${MINICONDA_INSTALL_DIR}/bin/conda /usr/bin/conda && \
    ln -s ${MINICONDA_INSTALL_DIR}/bin/python3 /usr/local/bin/python3 && \
    ln -s ${MINICONDA_INSTALL_DIR}/bin/python3 /usr/local/bin/python && \
    # configure conda and pip
    mv /root/.condarc.new ${MINICONDA_INSTALL_DIR}/.condarc && \
    sed -i -e "s~#ANACONDA_REPO_URL#~${ANACONDA_REPO_URL}~g" ${MINICONDA_INSTALL_DIR}/.condarc && \
    sed -i -e "s~#PYPI_URL#~${PYPI_URL}~g" /root/.pydistutils.cfg && \
    conda init bash && \
    conda env update --name base --file /root/environment.yml && \
    conda env update --name base --file /root/gms-test-environment.yml && \
    # configure node
    sed -i -e "s~#NODE_VERSION#~v${NODEJS_VERSION}~g" /usr/etc/npmrc && \
    sed -i -e "s~#NPM_REGISTRY#~${NPM_REGISTRY}~g" /usr/etc/npmrc && \
    sed -i -e "s~#NPM_REGISTRY_STRICT_SSL#~${NPM_REGISTRY_STRICT_SSL}~g" /usr/etc/npmrc && \
    # install node headers so we can build local libraries if necessary
    curl -fOL ${NODEJS_FILES_URL}/download/release/v${NODEJS_VERSION}/node-v${NODEJS_VERSION}-headers.tar.gz && \
    mkdir -p /usr/share/node && \
    mv node-v${NODEJS_VERSION}-headers.tar.gz /usr/share/node/node-v${NODEJS_VERSION}-headers.tar.gz && \
    # configure yarn
    yarn config set disable-self-update-check true && \
    yarn config set registry ${YARN_REGISTRY} && \
    yarn global add multiple-cucumber-html-reporter@1.10.1 && \
    # install gradle
    curl -fOL ${GRADLE_BASE_URL}/distributions/gradle-${GRADLE_VERSION}-bin.zip && \
    unzip -d /opt gradle-${GRADLE_VERSION}-bin.zip && \
    ln -s /opt/gradle-${GRADLE_VERSION}/bin/gradle /usr/bin/gradle && \
    rm -f gradle-${GRADLE_VERSION}-bin.zip && \
    # install sonarscanner
    curl -fOL ${SONAR_URL}/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VER}-linux.zip && \
    unzip -d /usr/local sonar-scanner-cli-${SONAR_SCANNER_VER}-linux.zip && \
    ln -s /usr/local/sonar-scanner-${SONAR_SCANNER_VER}-linux/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    rm -f sonar-scanner-cli-${SONAR_SCANNER_VER}-linux.zip && \
    # install docker-compose
    curl -fOL ${GITHUB_URL}/docker/compose/releases/download/${DOCKER_COMPOSE_VER}/docker-compose-Linux-x86_64 && \
    mv docker-compose-Linux-x86_64 /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    # install kubectl
    curl -fOL ${GOOGLEAPIS_URL}/kubernetes-release/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
    mv ./kubectl /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    # install helm
    curl -fOL ${HELM_URL}/helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
    tar xvf helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
    mv ./linux-amd64/helm /usr/local/bin/helm && \
    chmod +x /usr/local/bin/helm && \
    rm -rf helm-v${HELM_VERSION}-linux-amd64.tar.gz ./linux-amd64 && \
    # install minio client
    curl -fOL ${MINIO_URL}/client/mc/release/linux-amd64/mc && \
    mv ./mc /usr/local/bin/mc && \
    chmod +x /usr/local/bin/mc && \
    # cleanup
    yum clean all && \
    conda clean --all -y && \
    rm -rf /tmp/* /usr/src/*

CMD ["/bin/bash"]