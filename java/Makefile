NAME       = javadoc_server
DOCKERFILE = Dockerfile.javadoc_server

BUILD_ARGS = --build-arg 'FROM_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/httpd:2.4.41-alpine'

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
