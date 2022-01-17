NAME = builder

BUILD_ARGS = --build-arg 'FROM_IMAGE=$${CI_THIRD_PARTY_DOCKER_REGISTRY}/centos:7' \
             --build-arg 'CENTOS_YUM_URL=$${CENTOS_YUM_URL}' \
             --build-arg 'EPEL_YUM_URL=$${EPEL_YUM_URL}' \
             --build-arg 'GRADLE_BASE_URL=$${GRADLE_BASE_URL}' \
             --build-arg 'NODE_YUM_URL=$${NODE_YUM_URL}' \
             --build-arg 'NODEJS_FILES_URL=$${NODEJS_FILES_URL}' \
             --build-arg 'YARN_YUM_URL=$${YARN_YUM_URL}' \
             --build-arg 'NPM_REGISTRY=$${NPM_REGISTRY}' \
             --build-arg 'YARN_REGISTRY=$${YARN_REGISTRY}' \
             --build-arg 'CYPRESS_DOWNLOAD_MIRROR=$${CYPRESS_DOWNLOAD_MIRROR}' \
             --build-arg 'ELECTRON_MIRROR=$${ELECTRON_MIRROR}' \
             --build-arg 'MINICONDA_URL=$${MINICONDA_URL}' \
             --build-arg 'PYPI_URL=$${PYPI_URL}' \
             --build-arg 'SONAR_URL=$${SONAR_URL}' \
             --build-arg 'DOCKER_YUM_URL=$${DOCKER_YUM_URL}' \
             --build-arg 'GITHUB_URL=$${GITHUB_URL}' \
             --build-arg 'ANACONDA_REPO_URL=$${ANACONDA_REPO_URL}' \
             --build-arg 'GOOGLEAPIS_URL=$${GOOGLEAPIS_URL}' \
             --build-arg 'HELM_URL=$${HELM_URL}' \
             --build-arg 'MINIO_URL=$${MINIO_URL}'

CLEAN = rm -rf src/_python src/_centos src/_typescript

include $(shell CI-MAKE-CONFIG-PATH)/Makefile.docker
