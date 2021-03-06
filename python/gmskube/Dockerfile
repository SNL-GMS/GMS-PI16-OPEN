ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/python:${DOCKER_IMAGE_TAG}

ARG GOOGLEAPIS_URL=https://storage.googleapis.com
ARG KUBECTL_VERSION=1.19.0
ARG HELM_URL=https://get.helm.sh
ARG HELM_VERSION=3.3.1

# Run python with unbuffered stdout
ENV PYTHONUNBUFFERED=1
# Set the path to the CA bundle for python requests
ENV REQUESTS_CA_BUNDLE=/etc/pki/tls/certs/ca-bundle.crt
# The kubectl current context is passed in and saved by the entrypoint script
ENV KUBECONFIG=/kubeconfig/config
# Location of the deploy files
ENV DEPLOY_DIR=/deploy

RUN set -ex && \
    # Install kubectl
    curl -OL ${GOOGLEAPIS_URL}/kubernetes-release/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl && \
    mv ./kubectl /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    mkdir -p /kubeconfig && \
    # Install helm
    curl -OL ${HELM_URL}/helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
    tar xvf helm-v${HELM_VERSION}-linux-amd64.tar.gz && \
    mv ./linux-amd64/helm /usr/local/bin/helm && \
    chmod +x /usr/local/bin/helm && \
    rm -rf helm-v${HELM_VERSION}-linux-amd64.tar.gz ./linux-amd64

COPY ./gmskube /install/gmskube/gmskube
COPY ./setup.py /install/gmskube/setup.py
COPY ./_deploy ${DEPLOY_DIR}

RUN set -ex && \
    cd /install/gmskube && \
    python3 setup.py install

WORKDIR /
ENTRYPOINT ["gmskube.py"]
CMD ["--help"]
