ARG DOCKER_REGISTRY
ARG DOCKER_IMAGE_TAG
ARG PROJECT_NAME

FROM ${DOCKER_REGISTRY}/${PROJECT_NAME}/centos:${DOCKER_IMAGE_TAG}

ARG MINICONDA_URL=https://repo.anaconda.com
ARG ANACONDA_REPO_URL=https://conda.anaconda.org
ARG PYPI_URL=https://files.pythonhosted.org
ARG MINICONDA_VERSION=4.7.12.1
ARG MINICONDA_INSTALL_DIR=/usr/local/miniconda

# Set pip index
ENV PIP_INDEX_URL=$PYPI_URL
# Disable pip cache
ENV PIP_NO_CACHE_DIR=1
# Disable pip bytecode compile
ENV PIP_NO_COMPILE=1
# Run python with unbuffered stdout
ENV PYTHONUNBUFFERED=1
# Do not write python bytecode
ENV PYTHONDONOTWRITEBYTECODE=1
# Set the path to the CA bundle for python requests
ENV REQUESTS_CA_BUNDLE=/etc/pki/tls/certs/ca-bundle.crt

ENV PATH=$MINICONDA_INSTALL_DIR/bin:$PATH

COPY src/condarc /root/.condarc.new
COPY src/pydistutils.cfg /root/.pydistutils.cfg
COPY src/environment.yml /root/environment.yml
COPY src/gms-test-environment.yml /root/gms-test-environment.yml

RUN set -ex && \
    # install miniconda
    curl -fOL $MINICONDA_URL/miniconda/Miniconda3-$MINICONDA_VERSION-Linux-x86_64.sh && \
    bash Miniconda3-$MINICONDA_VERSION-Linux-x86_64.sh -b -p $MINICONDA_INSTALL_DIR && \
    rm -f Miniconda3-$MINICONDA_VERSION-Linux-x86_64.sh && \
    ln -s $MINICONDA_INSTALL_DIR/bin/conda /usr/bin/conda && \
    ln -s $MINICONDA_INSTALL_DIR/bin/python3 /usr/local/bin/python3 && \
    ln -s $MINICONDA_INSTALL_DIR/bin/python3 /usr/local/bin/python && \
    # configure conda and pip
    mv /root/.condarc.new $MINICONDA_INSTALL_DIR/.condarc && \
    sed -i -e "s~#ANACONDA_REPO_URL#~$ANACONDA_REPO_URL~g" $MINICONDA_INSTALL_DIR/.condarc && \
    sed -i -e "s~#PYPI_URL#~$PYPI_URL~g" /root/.pydistutils.cfg && \
    # install python environment - some pip packages need c++ compiler
    yum -y install gcc-c++ && \
    conda init bash && \
    # only apply the production environment by default
    conda env update --name base --file /root/environment.yml && \
    # clean up
    yum -y remove gcc-c++ && \
    yum clean all && \
    conda clean --all -y

CMD ["/bin/bash"]