NAME = prometheus-sidecar

BUILD_ARGS =

build:
	@echo ci-docker-build --name $(NAME) $(PULL_TAG) $(PUSH) $(DEBUG) $(BUILD_ARGS)

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
