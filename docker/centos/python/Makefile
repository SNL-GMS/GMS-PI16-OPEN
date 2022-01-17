NAME = python

BUILD_ARGS = --build-arg 'MINICONDA_URL=$${MINICONDA_URL}' \
             --build-arg 'PYPI_URL=$${PYPI_URL}' \
             --build-arg 'ANACONDA_REPO_URL=$${ANACONDA_REPO_URL}'

SUBDIRS := bastion \
           etcd

CLEAN = rm -rf src/environment.yml src/gms-test-environment.yml

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
