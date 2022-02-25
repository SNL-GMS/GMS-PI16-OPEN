#!/bin/bash

# This script is run to set up etcd

set -eu

#-- Start etcd temporarily for configuration and loading
etcd &
etcdpid=$!

#-- Wait for etcd to fully initialize
until etcdctl endpoint health; do
    sleep 1
done

#-- Add 'root' user and enable authentication
etcdctl user add "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
etcdctl auth enable

#-- Setup 'read-everything' and 'readwrite-everything' roles
etcdctl role add read-everything --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
etcdctl role add readwrite-everything --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
etcdctl role grant-permission --prefix read-everything read '' --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
etcdctl role grant-permission --prefix readwrite-everything readwrite '' --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"

#-- Setup 'gmsadmin' user 
etcdctl user add "gmsadmin:632ef028d2b60880b68a0dd4b182b9a242d746a5" --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
etcdctl user grant-role gmsadmin readwrite-everything --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"

#-- Load configuration as 'gmsadmin'
gms-sysconfig --username gmsadmin --password "632ef028d2b60880b68a0dd4b182b9a242d746a5" --endpoints localhost load /setup/config/system/gms-system-configuration.properties

#-- Setup 'gms' user
etcdctl --dial-timeout=6s user add "gms:70ab295b2e3a2203f28e5ea9c4f07aff649dec12" --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
etcdctl --dial-timeout=6s user grant-role gms read-everything --user "root:8088ded6639d28a8005ec98b204e71b7ac88cff2"
sleep 1

#-- Stop the now-configured etcd
kill ${etcdpid}


