NAME = centos

BUILD_ARGS = --build-arg 'FROM_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/centos:7' \
             --build-arg 'CENTOS_YUM_URL=$${CENTOS_YUM_URL}' \
             --build-arg 'EPEL_YUM_URL=$${EPEL_YUM_URL}'

SUBDIRS := java \
	   nginx \
	   postgres-exporter \
	   prometheus-sidecar \
	   python \
	   typescript \
	   ldap_proxy

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
