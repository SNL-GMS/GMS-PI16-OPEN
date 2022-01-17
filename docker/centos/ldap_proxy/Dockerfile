ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/centos:${DOCKER_IMAGE_TAG}

RUN set -ex && \
    yum -y install httpd mod_ldap mod_ssl && \
    rm /etc/httpd/conf.d/*.conf && \
    yum clean all

COPY src/docker-entrypoint.sh /docker-entrypoint.sh
COPY src/default-site.conf /etc/httpd/conf.d/

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD [ "/usr/sbin/apachectl", "-DFOREGROUND" ]
EXPOSE 80

HEALTHCHECK --interval=30s --retries=10 \
  CMD ps -ef | grep 'apache.*httpd' | grep -v grep \
  || exit 1
