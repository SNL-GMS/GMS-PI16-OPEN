#!/bin/bash

set -ex

SCRIPT_PATH=$( cd $( dirname "${BASH_SOURCE[0]}" ) > /dev/null && pwd)
TYPESCRIPT_PATH="${SCRIPT_PATH}/../../../typescript/user-interface"

# Copy the contents of the deploy directory from gms-common to the current directory
if [ ! -d "_user-interface" ]; then mkdir "_user-interface"; fi
cp -r ${TYPESCRIPT_PATH}/* _user-interface
