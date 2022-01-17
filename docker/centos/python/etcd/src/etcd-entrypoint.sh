#!/bin/bash

if [ $# -eq 0 ]; then
    echo "usage: entrypoint.sh etcd [options]"
    exit 1
fi

#-- start our entrypoint but ONLY respond to localhost
$@ --listen-client-urls=http://127.0.0.1:2379 &
pid=$!

#-- wait for etcd to report as healthy
while : ; do
    # check with both old and new passwords
    etcdctl endpoint health --user "gms:70ab295b2e3a2203f28e5ea9c4f07aff649dec12" 2> /dev/null 1> /dev/null
    if [ $? -eq 0 ]; then
       break
    fi
    etcdctl endpoint health --user "${GMS_ETCD_USER}:${GMS_ETCD_PASSWORD}" 2> /dev/null 1> /dev/null
    if [ $? -eq 0 ]; then
       break
    fi
    echo "############################ | waiting for etcd to start..."
    sleep 1
done

#-- update default passwords (if they have not been updated yet)
etcdctl endpoint health --user "${GMS_ETCD_USER}:${GMS_ETCD_PASSWORD}" 2> /dev/null 1> /dev/null
if [ $? -ne 0 ]; then
    echo "############################ | updating passwords..."
    echo ${GMS_ETCD_PASSWORD} | etcdctl user passwd --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2" ${GMS_ETCD_USER} --interactive=false
    echo ${GMS_ETCD_ADMIN_PASSWORD} | etcdctl user passwd --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2" ${GMS_ETCD_ADMIN_USER} --interactive=false
    echo ${GMS_ETCD_ROOT_PASSWORD} | etcdctl user passwd --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2" root --interactive=false
fi

#-- stop the now-configured etcd and restart so external clients can connect
kill ${pid}
wait ${pid}

#-- hand off to our entrypoint
echo "############################ | restarting etcd..."
exec $@
