#!/bin/bash

set -ex

SCRIPT_PATH=$( cd $( dirname "${BASH_SOURCE[0]}" ) > /dev/null && pwd)
DEPLOY_PATH="${SCRIPT_PATH}/../../deploy"

# Copy the contents of the deploy directory from gms-common to the current directory
if [ ! -d "_deploy" ]; then mkdir "_deploy"; fi
cp -r ${DEPLOY_PATH}/* _deploy
