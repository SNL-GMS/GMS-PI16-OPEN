#
#  Dockerfile to make a configured postgres image for GMS.
#
ARG FROM_IMAGE
FROM ${FROM_IMAGE}

ENV CONFIGDIR=/etc/postgresql
ENV POSTGRES_HOST_AUTH_METHOD="scram-sha-256"
ENV POSTGRES_INITDB_ARGS="--data-checksums -A --auth=scram-sha-256 --auth-host=scram-sha-256 --auth-local=scram-sha-256"

#Copy in our init scripts
COPY src/db-scripts/* /docker-entrypoint-initdb.d/
COPY src/gms-docker-entrypoint.sh /usr/local/bin/gms-docker-entrypoint.sh

# copy the configuration files
COPY src/postgresql.conf $CONFIGDIR/
COPY src/pg_hba.conf $CONFIGDIR/

ENTRYPOINT ["gms-docker-entrypoint.sh"]

# note: the config_file argument is set in gms-docker-entrypoint.sh
CMD ["postgres"]