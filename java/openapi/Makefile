NAME = swagger-gms

BUILD_ARGS = --build-arg 'FROM_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/swaggerapi/swagger-ui:v3.24.0'

CLEAN = rm -rf spec/*

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker

