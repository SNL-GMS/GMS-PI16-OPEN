ARG FROM_IMAGE
FROM ${FROM_IMAGE}

COPY configure-spec-files.sh /configure-spec-files.sh

COPY spec /usr/share/nginx/html/spec

RUN sed -i '/gzip_types/a \ \ map $remote_addr $log_ip {\"127.0.0.1" 0;\ default 1;}' /etc/nginx/nginx.conf && \
    sed -i '/index/a \ \ \ \ access_log /var/log/nginx/access.log combined if=$log_ip;' /etc/nginx/nginx.conf && \
    sed -i '/index/a \ \ \ \ absolute_redirect off;' /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=30s \
  CMD wget --quiet --spider http://localhost:8080 \ 
    || exit 1

# The `swaggerapi/swagger-ui` image had a CMD of `sh /usr/share/nginx/run.sh`.
# Here we just stick our `configure-spec-files.sh` script in front of that so
# that it can setup the $URLS environment variable based on the files that it
# finds in the `/usr/share/nginx/html/spec` directory at run time.
CMD ["sh", "/configure-spec-files.sh", "/usr/share/nginx/run.sh"]
