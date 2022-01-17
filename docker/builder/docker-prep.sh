#!/bin/bash -ex

# run the docker-prep.sh script in python
pushd ../centos/python
./docker-prep.sh
popd

# rsync the src dirs
rsync -av ../centos/src/ ./src/_centos
rsync -av ../centos/typescript/src/ ./src/_typescript
rsync -av ../centos/python/src/ ./src/_python
