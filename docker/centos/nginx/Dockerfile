ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/centos:${DOCKER_IMAGE_TAG}

ARG NGINX_YUM_URL=http://nginx.org

# Configure an nginx repo and install
COPY src/nginx.repo /etc/yum.repos.d/nginx.repo
COPY src/nginx_signing.key /etc/pki/rpm-gpg/nginx_signing.key

RUN set -ex && \
    sed -i -e "s~#NGINX_YUM_URL#~$NGINX_YUM_URL~g" /etc/yum.repos.d/nginx.repo && \
    yum install -y nginx && \
    yum clean all && \
    mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx

# Expose NGINX ports
EXPOSE 8080 8443

USER nginx

ENTRYPOINT ["nginx", "-g", "daemon off;"]
