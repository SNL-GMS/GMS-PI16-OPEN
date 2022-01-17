#
#  Dockerfile to make a configured etcd image for GMS.
#
ARG FROM_IMAGE
FROM ${FROM_IMAGE}

#Copy in our init scripts
#COPY ./init.sh /bin/init.sh

#ENTRYPOINT ["init.sh"]
ENTRYPOINT ["/bin/prometheus"]
CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus/", "--storage.tsdb.retention.time=30d"]
