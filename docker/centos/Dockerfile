ARG FROM_IMAGE
FROM ${FROM_IMAGE}

ARG CENTOS_YUM_URL=http://mirror.centos.org/centos/
ARG EPEL_YUM_URL=https://mirrors.fedoraproject.org/pub/epel

COPY src/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo
COPY src/RPM-GPG-KEY-EPEL-7 /etc/pki/rpm-gpg/RPM-GPG-KEY-EPEL-7
COPY src/epel.repo /etc/yum.repos.d/epel.repo

# Reset shell to source environment files and always use bash.
SHELL [ "/bin/bash", "-lc" ]

# set locale env vars
ENV LANG="en_US.UTF-8"
ENV LANGUAGE="en_US.UTF-8"
ENV LC_ALL="en_US.UTF-8"

RUN set -ex && \
    sed -i -e "s~#CENTOS_YUM_URL#~$CENTOS_YUM_URL~" /etc/yum.repos.d/CentOS-Base.repo && \
    sed -i -e "s~#EPEL_YUM_URL#~$EPEL_YUM_URL~g" /etc/yum.repos.d/epel.repo && \
    echo "ip_resolve=4" >> /etc/yum.conf && \
    echo "skip_missing_names_on_install=0" >> /etc/yum.conf && \
    yum -y update && \
    yum install -y yum-plugin-versionlock ca-certificates less gettext jq && \
    yum clean all && \
    # setup locale
    localedef -i en_US -f UTF-8 en_US.UTF-8 && \
    echo "LANG=\"en_US.UTF-8\"" > /etc/locale.conf

CMD ["/bin/bash"]
