#!/usr/bin/env python3

# --------------------------------------------------------------------
#  gmskube - Geophysical Monitoring System Control Utility
#
#  The gmskube command-line program is used to install and configure
#  instances of the GMS (Geophysical Monitoring System) system
#  on Kubernetes.
# --------------------------------------------------------------------
import argparse
import base64
import getpass
import io
import json
import logging
import os
import re
import shlex
import subprocess
import sys
import tarfile
import time
import traceback
import uuid
from argparse import ArgumentParser, RawDescriptionHelpFormatter
from operator import itemgetter
from signal import signal, SIGINT

import jinja2
import requests
import yaml
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from requests.packages.urllib3.util.retry import Retry
from termcolor import cprint

# Types
TYPES = ['soh', 'ian', 'logging', 'grafana', 'sb']


# Label Constants
class LABEL:
    TYPE = 'gms/type'
    USER = 'gms/user'
    UPDATE_TIME = 'gms/update-time'
    IMAGE_TAG = 'gms/image-tag'


# YAML file extension
YAML_EXTENSION = '.yaml'


def main():
    parser = get_parser()
    args = get_args(parser)

    # configure logging - make sure this comes before any call to logging
    # remove any existing logging handlers that may have been setup in imports
    while len(logging.root.handlers):
        logging.root.removeHandler(logging.root.handlers[-1])
    logging.basicConfig(format='[%(levelname)s] %(message)s', level=getattr(logging, args.verbose))
    # capture any messages from the warnings module
    logging.captureWarnings(True)

    # save kubectl context into a file if the env var is set
    if 'KUBECTL_CONTEXT' in os.environ:  # pragma: no branch
        logging.debug('KUBECTL_CONTEXT is set, saving file')
        # save the context into /kubeconfig/config where $KUBECONFIG env var is set in the dockerfile
        # Hard coding the path instead of using the env var to prevent fortify finding
        with open('/kubeconfig/config', "w") as kube_file:
            print(f"{os.getenv('KUBECTL_CONTEXT')}", file=kube_file)

    # set SSL cert path for python requests library
    if 'REQUESTS_CA_BUNDLE' not in os.environ:  # pragma: no branch
        # this path is the default for centos7
        os.environ['REQUESTS_CA_BUNDLE'] = '/etc/pki/tls/certs/ca-bundle.crt'

    # print debug arguments
    logging.debug('Arguments:')
    for arg in vars(args):
        logging.debug(f"    {arg} = {getattr(args, arg) or ''}")

    # print out the entire env for debug
    logging.debug('Environment:\n' + '\n'.join([f'        {key}={value}' for key, value in sorted(os.environ.items())]))

    # call appropriate function if a command was specified, otherwise just print help.
    if hasattr(args, 'command'):
        try:
            args.command(args)
        except Exception as ex:  # pragma no coverage
            print_error(ex)
            traceback.print_exc()
            sys.exit(1)
    else:
        help_command(args, parser)


def get_parser():
    # Get main argparse parser.
    # Any time new arguments are added, be sure to regenerate the bash_completion:
    #  `shtab gmskube.gmskube.get_parser > bash_completion`

    description = """
description:
  The gmskube command-line program is used to install and configure instances
  of the GMS (Geophysical Monitoring System) system on Kubernetes.

  Each "instance" is an install of a multi-container application that is
  managed as a single unit and runs on a Kubernetes cluster. Each instance is
  contained within its own namespace in Kubernetes.  Various predefined types
  of instances are available.

  Some example instance types would be 'soh', 'ian', 'logging', 'sb' or 'grafana'.

  Multiple copies of 'soh' type instance may be run simultaneously. Each
  instance must be given a unique name to identify it as well as distinguish it
  from other running instances of the same type.

  For example, one instance of 'soh' may be running as 'develop' while another
  instance of 'soh' may be running as 'integration'.

  Different versions of a instance type may be available from the configured
  Docker registry. Released versions of GMS are tagged with a specific version
  number. During development this would correspond to a tag name on the docker images.

configuration:
  Before you can run gmskube, you must first download a Kubeconfig bundle from
  the cluster, and have the kubectl context set to the correct cluster.

  1. Login to Rancher
  2. Click the cluster name
  3. In the upper right, click the blue Kubeconfig File button
  4. Copy/Paste the contents into ~/.kube/config on your development machine
  5. If you have kubectl installed, the KUBECONFIG environment variable should
     already be set.  If not, set KUBECONFIG=~/config

commands:
  See the --help for details of each command.
   
examples:
  Get usage help for the gmskube tool:
    $ gmskube --help
    
  Install a SOH deployment of the default tag, with name 'my-test':
    $ gmskube install --type soh my-test
    
  Install a SOH deployment of the tag 'tag123', with the name 'my-test':
    $ gmskube install --type soh --tag tag123 my-test
"""
    parser = ArgumentParser(description=description,
                            formatter_class=RawDescriptionHelpFormatter,
                            prog='gmskube')

    # global arguments
    parser.add_argument('-v', '--verbose', default='INFO', action='store_const', const='DEBUG',
                        help='Enable debug level output.')
    parser.add_argument('--timeout', type=int, default=4,
                        help='Specify the max time in minutes (integer) that gmskube should wait '
                             'for various actions to complete.')

    # Parent parsers contains common arguments that can be reused when adding a parser
    # Only add a parent parser if it will be used in more than one command. Otherwise
    # just add it directly to the command.

    # parent name parser
    parent_name_parser = argparse.ArgumentParser(add_help=False)
    parent_name_parser.add_argument('name', nargs=1, type=argparse_instance_name_type,
                                    help='Name of the instance')

    # parent tag parser
    parent_tag_parser = argparse.ArgumentParser(add_help=False)
    parent_tag_parser.add_argument('--tag', required=True, type=argparse_tag_name_type,
                                   help='Tag name, which corresponds to the docker tag of the images. '
                                        'The value entered will automatically be transformed according to the '
                                        'definition of the gitlab CI_COMMIT_REF_SLUG variable definition '
                                        '(lowercase, shortened to 63 characters, and with everything except '
                                        '`0-9` and `a-z` replaced with `-`, no leading / trailing `-`).')

    # parent set parser
    parent_set_parser = argparse.ArgumentParser(add_help=False)
    parent_set_parser.add_argument('--set', dest='namevalue', type=argparse_set_type, action='append',
                                   help='Set a value in the chart to the specified value.  May be specified '
                                        'multiple times for different values.  Examples: `--set foo=bar` to '
                                        'set value `foo` to `bar`.  `--set env.GLOBAL_VAR=Hello` to set the '
                                        '`GLOBAL_VAR` environment variable to `Hello` in all application Pods '
                                        'within the instance.  `--set cd11-connman.env.CONNMAN_VAR=World` to '
                                        'set the `CONNMAN_VAR` environment var to `World` only in the '
                                        '`cd11-connman` app\'s Pod. `--set bastion.replicas=0` to set the '
                                        '`replicas` chart value in the bastion chart to `0`.')

    # parent injector livedata parser
    parent_injector_livedata_parser = argparse.ArgumentParser(add_help=False)
    # mutual exclusive group for injector and livedata
    injector_livedata_group = parent_injector_livedata_parser.add_mutually_exclusive_group()
    injector_livedata_group.add_argument('--injector', default=False, action='store_true',
                                         help='Include the data injector in the instance')
    injector_livedata_group.add_argument('--livedata', default=False, action='store_true',
                                         help='Include live data in the instance')
    # optional args for injector and live data
    parent_injector_livedata_parser.add_argument('--injector-dataset',
                                                 help='Dataset for the injector. If not specified, the default is '
                                                      'the value set in the helm "values.yaml" file.')
    parent_injector_livedata_parser.add_argument('--connman-port', type=int,
                                                 help='If specified, sets the environment variable to change the '
                                                      'well known port for the CD11 connman service, and configures '
                                                      'the port in kubernetes to be externally visible.')
    parent_injector_livedata_parser.add_argument('--connman-data-manager-ip', type=argparse_ip_address_type,
                                                 help='If specified, sets the environment variable to change the '
                                                      'external IP address of the CD11 dataman service.')
    parent_injector_livedata_parser.add_argument('--connman-data-provider-ip', type=argparse_ip_address_type,
                                                 help='If specified, sets the environment variable to change IP '
                                                      'address of the data provider sending data to the CD11 dataman '
                                                      'service.')
    parent_injector_livedata_parser.add_argument('--dataman-ports', type=argparse_dataman_ports_type,
                                                 help='If specified, sets the environment variable to change the port '
                                                      'range for the CD11 dataman service, and configures the ports '
                                                      'in kubernetes to be externally visible.')

    # parent config parser
    parent_config_parser = argparse.ArgumentParser(add_help=False)
    parent_config_parser.add_argument('--config',
                                      help='Path to a directory of configuration overrides to load into instance')

    # parent dry-run parser
    parent_dryrun_parser = argparse.ArgumentParser(add_help=False)
    parent_dryrun_parser.add_argument('--dry-run', default=False, action='store_true',
                                      help='View the objects to be applied but do not send them')

    subparsers = parser.add_subparsers(help='Available sub-commands:')

    # Install
    install_parser = subparsers.add_parser('install',
                                           parents=[parent_name_parser, parent_tag_parser,
                                                    parent_set_parser, parent_injector_livedata_parser,
                                                    parent_config_parser, parent_dryrun_parser],
                                           help='Install an instance of the system')
    # type and chart are mutually exclusive, and at least one must be specified. Chart arg gets repeated again in
    # upgrade, but we can't implement as a parent parser due to the group here.
    install_type_chart_group = install_parser.add_mutually_exclusive_group(required=True)
    install_type_chart_group.add_argument('--type', choices=TYPES, help='Type of instance')
    install_type_chart_group.add_argument('--chart',
                                          help='Path to a local helm chart directory to deploy. If not specified, '
                                               'the helm chart is automatically extracted from a docker image that '
                                               'contains the chart files for the branch. Note the directory must '
                                               'exist at or below the present directory (PWD), no `../` is allowed.')
    install_parser.add_argument('--wallet',
                                help='Optional path to an Oracle Wallet directory. Under normal circumstances '
                                     'a shared cluster-wide oracle-wallet secret will automatically be used for '
                                     'the instance, so supplying an Oracle Wallet is not necessary. This argument '
                                     'should only be used when testing a new Oracle Wallet that is not yet installed '
                                     'on the cluster.')
    install_parser.add_argument('--istio', default=False, action='store_true',
                                help='Enable istio-injection label in the namespace.')
    install_parser.add_argument('--no-create-namespace', default=False, action='store_true',
                                help='Do not create the namespace as part of the install, use existing namespace.')

    install_parser.set_defaults(command=install_command)

    # Reconfig
    reconfig_parser = subparsers.add_parser('reconfig',
                                            parents=[parent_name_parser, parent_config_parser],
                                            help='Reconfigure a running instance of a system')
    reconfig_parser.set_defaults(command=reconfig_command)

    # Upgrade
    upgrade_parser = subparsers.add_parser('upgrade',
                                           parents=[parent_name_parser, parent_set_parser,
                                                    parent_injector_livedata_parser, parent_tag_parser,
                                                    parent_dryrun_parser],
                                           help='Upgrade an instance of the system')
    # for Upgrade, type is not an option since we don't want to let people change the type during an upgrade. Chart
    # is optional here. Not implemented as a parent parser since it won't work with the group in Install.
    upgrade_parser.add_argument('--chart',
                                help='Path to a local helm chart directory to deploy. If not specified, '
                                     'the helm chart is automatically extracted from a docker image that '
                                     'contains the chart files for the branch. Note the directory must '
                                     'exist at or below the present directory (PWD), no `../` is allowed.')
    upgrade_parser.set_defaults(command=upgrade_command)

    # Uninstall
    uninstall_parser = subparsers.add_parser('uninstall',
                                             parents=[parent_name_parser],
                                             help='Uninstall an instance of the system')
    uninstall_parser.set_defaults(command=uninstall_command)

    # List
    list_parser = subparsers.add_parser('list', aliases=['ls'], help='List instances')
    list_parser.add_argument('--user', help='List only instances deployed by the specified user.')
    list_parser.add_argument('--type', choices=TYPES, help='List only instances of the specified type.')
    list_parser.add_argument('--all', '-a', default=False, action='store_true',
                             help='Include all namespaces (system, rancher, etc.), not just GMS instances.')
    list_parser.set_defaults(command=list_command)

    # Augment [Apply, Delete, Catalog]
    augment_parser = subparsers.add_parser('augment', help='Augment a running instance of the system')
    augment_subparsers = augment_parser.add_subparsers(help='Available augment sub-commands:')

    parent_augment_object_parser = argparse.ArgumentParser(add_help=False)
    parent_augment_object_group = parent_augment_object_parser.add_mutually_exclusive_group(required=True)
    parent_augment_object_group.add_argument('--name', '-n', dest='augmentation_name',
                                             help='Name of augmentation. See --list for available names.')
    parent_augment_object_group.add_argument('--file', '-f', dest='augmentation_file',
                                             help='Path to a local Kubernetes augmentation object file. '
                                                  'Note the directory containing the object yaml file '
                                                  'must exist at or below the present directory (PWD), no '
                                                  '`../` is allowed.')

    # Augment Apply
    augment_apply_parser = augment_subparsers.add_parser('apply',
                                                         parents=[parent_augment_object_parser, parent_set_parser,
                                                                  parent_name_parser, parent_dryrun_parser],
                                                         help='Apply an augmentation to a running instance of the system')
    augment_apply_parser.set_defaults(command=augment_apply_command)

    # Augment Delete
    augment_delete_parser = augment_subparsers.add_parser('delete',
                                                          parents=[parent_augment_object_parser, parent_set_parser,
                                                                   parent_name_parser, parent_dryrun_parser],
                                                          help='Delete the specified augmentation')
    augment_delete_parser.set_defaults(command=augment_delete_command)

    # Augment Catalog
    augment_catalog_parser = augment_subparsers.add_parser('catalog', aliases=['cat'], help='Catalog of available augmentation names')
    augment_catalog_parser.set_defaults(command=augment_catalog_command)
    augment_catalog_parser.add_argument('--json', default=False, action='store_true',
                                        help='Return catalog in json format')

    return parser


def get_args(parser):
    args = parser.parse_args()

    # check if livedata is specified for any optional live data args
    if (getattr(args, 'connman_port', None) is not None
        or getattr(args, 'connman_data_manager_ip', None) is not None
        or getattr(args, 'connman_data_provider_ip', None) is not None
        or getattr(args, 'dataman_ports', None) is not None) and not getattr(args, 'livedata', False):
        parser.error('--livedata must be specified if any of --connman-port, --connman-data-manager-ip, '
                     '--connman-data-provider-ip, or --dataman-ports are provided.')

    return args


# ---------- Argparse Types -----------------


def argparse_instance_name_type(s, pat=re.compile(r'^[a-z0-9][a-z0-9-]{1,126}[a-z0-9]$')):
    """
    Define an argparse type for instance names.  This checks two limitations
    that apply to instance names:
    1. Instance name length is between 3 and 128 characters. Until we find out
       otherwise, this is an arbitrary limit.
    2. The instance name will be used as part of a DNS hostname, so it must
       comply with DNS naming rules:
       "hostname labels may contain only the ASCII letters 'a' through 'z' (in
       a case-insensitive manner), the digits '0' through '9', and the hyphen
       ('-'). The original specification of hostnames in RFC 952, mandated that
       labels could not start with a digit or with a hyphen, and must not end
       with a hyphen. However, a subsequent specification (RFC 1123) permitted
       hostname labels to start with digits. No other symbols, punctuation
       characters, or white space are permitted.
    """

    if not pat.match(s):
        raise argparse.ArgumentTypeError(
            'Instance name must be between 3 and 128 characters long, consist only of lower case letters '
            'digits, and hyphens.')
    return s


def argparse_tag_name_type(s):
    """
    Transform the tag name into the CI_COMMIT_REF_SLUG as defined by gitlab:
    Lower-cased, shortened to 63 bytes, and with everything except `0-9` and `a-z` replaced with `-`.
    No leading / trailing `-`
    """

    # s.lower() changes to lower case, re.sub replaces anything other than a-z 0-9 with `-`
    # strip('-') removes any leading or trailing `-` after re.sub, finally [:63] truncates to 63 chars
    return re.sub(r'[^a-z0-9]', '-', s.lower()).strip('-')[:63]


def argparse_set_type(s, pat=re.compile(r'^.+=.*')):
    """
    Use a regular expression to match a helm value of the form:
    VARIABLE=VALUE
    Helm accepts a lot of different values, https://helm.sh/docs/intro/using_helm/#the-format-and-limitations-of---set
    so the regex is not very restrictive to allow for all the different forms
    """
    m = pat.match(s)

    if not m:
        raise argparse.ArgumentTypeError(
            'When specifying `--set`, you must supply helm chart name/value pair as: `Name=Value`'
        )

    return s


def argparse_ip_address_type(s, pat=re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')):
    """
    Really basic IP address validation
    """
    if not pat.match(s):
        raise argparse.ArgumentTypeError(
            'Must be a valid IP address (example: 192.168.1.1)'  # NOSONAR - just an example; does not need to be configurable
        )
    return s


def argparse_dataman_ports_type(s, pat=re.compile(r'^\d{1,5}-\d{1,5}$')):
    """
    Dataman port range should be two numbers separated by a dash
    """

    if not pat.match(s):
        raise argparse.ArgumentTypeError(
            'Dataman port range must be two integers separated by a dash (example: 8100-8199)'
        )
    return s


# ---------- Commands -----------------


def install_command(args, parser=None):
    """
    Perform helm install command, with some extra options for data load
    """
    cprint(f'Installing {args.name[0]}...', color='cyan')

    kubectl_host = os.getenv('KUBECTL_HOST')
    docker_registry = os.getenv('CI_DOCKER_REGISTRY')

    # Set the instance type to be custom if loading in a user-defined custom chart directory
    if args.chart is not None:
        args.type = "custom"

    # create the namespace
    if not args.no_create_namespace and not args.dry_run:
        print(f'Creating namespace {args.name[0]}')
        return_code, out, err = run_command(f'kubectl create namespace {args.name[0]}', print_output=True)
        if return_code > 0:
            exit(return_code)

    # add istio-injection label
    if args.istio and not args.dry_run:
        print('Adding istio-injection=enabled label to namespace')
        return_code, out, err = run_command(f'kubectl label namespaces {args.name[0]} istio-injection=enabled', print_output=True)
        if return_code > 0:
            exit(return_code)

    # create oracle-wallet secret
    if args.type in ['ian', 'sb', 'custom'] and not args.dry_run:
        create_oracle_wallet_secret(args.wallet, args.name[0])

    # build up the command array
    install_cmd = shlex.split(
        f'helm install {args.name[0]} {args.type} '
        f'--namespace {args.name[0]} '
        f'--set "baseDomain={kubectl_host}" '
        f'--set "imageRegistry={docker_registry}" '
        f'--set "global.imageRegistry={docker_registry}" '
        f'--set "kafka.image.registry={docker_registry}" '
        f'--set "kafka.zookeeper.image.registry={docker_registry}" '
        f'--set "imageTag={args.tag}" '
        f'--set "global.imageTag={args.tag}" '
        f'--set "kafka.image.tag={args.tag}" '
        f'--set "kafka.zookeeper.image.tag={args.tag}" '
        f'--set "user={getpass.getuser()}" '
        f'--set "password.etcd.gms={uuid.uuid4()}" '
        f'--set "password.etcd.gmsadmin={uuid.uuid4()}" '
        f'--set "password.etcd.root={uuid.uuid4()}" '
        f'--set "password.postgres.gms_super_user={uuid.uuid4()}" '
        f'--set "password.postgres.gms_admin={uuid.uuid4()}" '
        f'--set "password.postgres.gms_config_application={uuid.uuid4()}" '
        f'--set "password.postgres.gms_read_only={uuid.uuid4()}" '
        f'--set "password.postgres.gms_session_application={uuid.uuid4()}" '
        f'--set "password.postgres.gms_soh_application={uuid.uuid4()}" '
        f'--set "password.postgres.gms_soh_test_application={uuid.uuid4()}" '
        f'--set "password.postgres.gms_soh_ttl_application={uuid.uuid4()}" '
        # These --set commands are for GRAFANA --BEGIN
        f'--set "image.repository={docker_registry}/gms-common/monitoring-grafana" '
        f'--set "image.tag={args.tag}" '
        f'--set "initChownData.image.repository={docker_registry}/gms-common/monitoring-busybox" '
        f'--set "initChownData.image.tag={args.tag}" '
        # These --set commands are for GRAFANA --END
        # These --set commands are for LOGGING --BEGIN
        f'--set "global.baseDomain={kubectl_host}" '
        f'--set "ldap-proxy.imageTag={args.tag}" '
        f'--set "ldap-proxy.imageName=gms-common/ldap_proxy" '
        f'--set "ldap-proxy.baseDomain={kubectl_host}" '
        f'--set "ldap-proxy.imageRegistry={docker_registry}" '
        f'--set "elasticsearch.image={docker_registry}/gms-common/logging-elasticsearch" '
        f'--set "elasticsearch.imageTag={args.tag}" '
        f'--set "fluent-bit.imageRegistry={docker_registry}" '
        f'--set "fluent-bit.image.repository={docker_registry}/gms-common/logging-fluent-bit" '
        f'--set "fluent-bit.image.tag={args.tag}" '
        f'--set "fluent-bit.testFramework.image.repository={docker_registry}/gms-common/logging-busybox" '
        f'--set "fluent-bit.testFramework.image.tag={args.tag}" '
        f'--set "kibana.image={docker_registry}/gms-common/logging-kibana" '
        f'--set "kibana.imageTag={args.tag}" '
        # These --set commands are for LOGGING --END
        f'--render-subchart-notes '
    )

    # add any custom helm values set by the --set option
    if args.namevalue is not None:  # pragma: no branch
        for item in args.namevalue:
            install_cmd.extend(shlex.split(f'--set "{item}" '))

    # add injector/livedata args
    install_cmd.extend(get_injector_livedata_set_args(args.injector, args.injector_dataset, args.livedata,
                                                      args.connman_port, args.connman_data_manager_ip,
                                                      args.connman_data_provider_ip, args.dataman_ports))

    # add dry-run
    if args.dry_run:
        install_cmd.extend(shlex.split('--dry-run --debug'))

    # run helm install
    return_code, out, err = run_command(install_cmd, print_output=True)

    # if dry-run just exit here since everything else after this point requires a real install
    if args.dry_run:
        sys.exit(return_code)

    if return_code > 0:
        print_error(f'Could not install instance {args.name[0]}: {err}')
        sys.exit(return_code)

    # Run the config-loader
    if not request_dataload(f'{kubectl_host}', f'{args.name[0]}', config_overrides=args.config,
                            timeout=args.timeout):
        print_error(f'Dataload failed to execute successfully...Exiting')
        sys.exit(1)

    # print ingress routes
    print('\nBelow are the ingress routes for each service in the instance:')
    run_command(f'kubectl get ingress '
                f'--namespace {args.name[0]} '
                f'--output custom-columns=SERVICE:.metadata.name,HOST:.spec.rules[*].host,PATH:.spec.rules[*].http.paths[*].path', print_output=True)

    cprint(f'{args.name[0]} installed successfully!', color='green', attrs=['bold'])


def upgrade_command(args, parser=None):
    """
    Perform helm upgrade command
    """
    cprint(f'Upgrading {args.name[0]}...', color='cyan')

    # get the instance type
    if args.chart is not None:
        # Set the instance type to be custom if loading in a user-defined custom chart directory
        instance_type = "custom"
    else:
        # get the instance type from the labels. We don't use args.type here because we don't allow the type
        # to be changed during upgrade.
        instance_type = get_instance_labels(args.name[0]).get(LABEL.TYPE, None)

    # check if the instance type is none and error
    if instance_type is None:
        print_error(f'Could not determine the type for instance {args.name[0]}. Possible causes:\n'
                    '        - Instance is not installed. Check by running `gmskube ls`.\n'
                    '        - Instance was not installed using `gmskube` and is missing metadata. Uninstall then use `gmskube install`.')
        sys.exit(1)

    # get existing values
    return_code, out, err = run_command(f'helm get values {args.name[0]} --all '
                                        f'--namespace {args.name[0]}', print_output=False)

    # save existing values to tmp file
    if return_code == 0:
        with open('/tmp/existing_values.yaml', 'w') as existing_values:
            print(out, file=existing_values)
    else:
        # if we can't get the existing values then error
        print_error(f'Unable to get existing values for instance {args.name[0]}: {err}')
        sys.exit(return_code)

    # Run helm upgrade
    # Provide the values file from the chart followed by the existing values, this should merge them together
    upgrade_cmd = shlex.split(
        f'helm upgrade {args.name[0]} {instance_type} '
        f'--namespace {args.name[0]} '
        f"--values {os.path.join('/deploy', instance_type, 'values.yaml')} "
        f'--values /tmp/existing_values.yaml '
        f'--set "imageTag={args.tag}" '
        f'--render-subchart-notes '
    )

    # add any custom helm values set by the --set option
    if args.namevalue is not None:  # pragma: no branch
        for item in args.namevalue:
            upgrade_cmd.extend(shlex.split(f'--set "{item}"'))

    # add injector/livedata args
    upgrade_cmd.extend(get_injector_livedata_set_args(args.injector, args.injector_dataset, args.livedata,
                                                      args.connman_port, args.connman_data_manager_ip,
                                                      args.connman_data_provider_ip, args.dataman_ports))

    # add dry-run
    if args.dry_run:
        upgrade_cmd.extend(shlex.split('--dry-run --debug'))

    return_code, out, err = run_command(upgrade_cmd, print_output=True)

    if return_code > 0:
        print_error(f'Could not upgrade instance {args.name[0]}: {err}')
        sys.exit(return_code)

    cprint(f'{args.name[0]} upgrade complete!', color='green', attrs=['bold'])


def uninstall_command(args, parser=None):
    """
    Perform helm uninstall command, wait for pods to terminate, then delete the namespace
    """
    cprint(f'Uninstalling {args.name[0]}...', color='cyan')

    # run helm uninstall
    cprint('Running helm uninstall...', color='magenta')
    run_command(f'helm uninstall {args.name[0]} --namespace {args.name[0]}', print_output=True)

    # wait for resources created by helm to terminate since helm uninstall is async
    timeout_seconds = args.timeout * 60
    time_waited = 0
    while time_waited < timeout_seconds:  # pragma: no branch
        # get resources filtered by label
        return_code, out, err = run_command(f"kubectl get all --no-headers "
                                            f"--selector='app.kubernetes.io/managed-by==Helm' "
                                            f"--output name --namespace {args.name[0]}", print_output=False)

        # check the count of lines returned
        if len(out.splitlines()) == 0:
            break

        if time_waited % 15 == 0:  # pragma: no branch
            # print a message every 15 seconds noting that we are waiting
            cprint(f'Waiting for helm resources to terminate...{len(out.splitlines())} resources remaining', color='magenta')

        time.sleep(1)
        time_waited += 1

        if time_waited >= timeout_seconds:  # pragma: no coverage
            print_warning('Timed out waiting for helm resources to terminate, attempting to delete the namespace anyway...')

    # Delete the namespace
    cprint('Deleting namespace...', color='magenta')
    run_command(f'kubectl delete namespace {args.name[0]}', print_output=True)

    cprint(f'{args.name[0]} uninstall complete!', color='green', attrs=['bold'])


def reconfig_command(args, parser=None):
    """
    Perform the instance reconfig command - run a reduced dataload, then rollout restart deployments that require it
    """
    cprint(f'Reconfiguring {args.name[0]}...', color='cyan')

    if not request_dataload(os.getenv('KUBECTL_HOST'), f'{args.name[0]}', endpoint='reload',
                            config_overrides=args.config,
                            timeout=args.timeout):
        print_error(f'Dataload failed to execute successfully...Exiting')
        sys.exit(1)

    cprint(f'Rollout restart deployments with label "restartAfterReconfig=true" in instance {args.name[0]} ...', color='magenta')
    # get deployments with restartAfterReconfig label
    return_code, out, err = run_command(f'kubectl get deployment --output name --selector restartAfterReconfig=true '
                                        f'--no-headers --namespace {args.name[0]}', print_output=False)

    if return_code > 0:
        print_error(f'Unable to get list of deployment requiring restart: {err}')
        sys.exit(return_code)

    # rollout restart each deployment
    deployments = out.splitlines()
    for deployment in deployments:
        run_command(f'kubectl rollout restart {deployment} --namespace {args.name[0]}', print_output=True)

    cprint(f'{args.name[0]} reconfig complete!', color='green', attrs=['bold'])


def list_command(args, parser=None):
    """
    List helm instances and show some gms labels
    """

    # Get all the helm instances
    return_code, out, err = run_command('helm list --all --all-namespaces --output json', print_output=False)
    if return_code > 0:
        print_error(f'Could not list instances: {err}')
        sys.exit(return_code)

    # column format
    col_format = '%-32s   %-10s   %-8s   %-13s   %-18s   %-14s   %-23s'
    # Setup the header
    print(col_format % ('NAME',
                        'STATUS',
                        'TYPE',
                        'USER',
                        'UPDATED',
                        'CD11-PORTS',
                        'TAG',
                        ))
    print(col_format % ('----',
                        '------',
                        '----',
                        '----',
                        '-------',
                        '----------',
                        '---',
                        ))

    instances = json.loads(out)

    # get gms labels for all instances
    all_labels = get_all_labels()

    # loop through each of the helm instances
    for instance in instances:
        # get the labels for this instance, or empty dict if it doesn't exist
        labels = next((item for item in all_labels if item["gms/name"] == instance['name']), {})  # pragma: no branch

        # filter instances without gms labels unless the "all" arg is specified
        if not args.all and len(labels) == 0:
            continue

        # filter on the user if provided
        if args.user is not None and labels.get(LABEL.USER, '?') != args.user:
            continue

        # filter on the type of provided
        if args.type is not None and labels.get(LABEL.TYPE, '?') != args.type:
            continue

        # Only display something in the CD11-PORTS for instances attached to live data
        livedata = "-"
        if (labels.get('gms/cd11-live-data', '') == 'true'  # pragma: no branch
                and labels.get('gms/cd11-connman-port')
                and labels.get('gms/cd11-dataman-port-start')
                and labels.get('gms/cd11-dataman-port-end')):
            livedata = '%s,%s-%s' % (labels.get('gms/cd11-connman-port'),
                                     labels.get('gms/cd11-dataman-port-start'),
                                     labels.get('gms/cd11-dataman-port-end')
                                     )

        print(col_format % (instance['name'],
                            instance['status'],
                            labels.get(LABEL.TYPE, '?'),
                            labels.get(LABEL.USER, '?'),
                            labels.get(LABEL.UPDATE_TIME, '?'),
                            livedata,
                            labels.get(LABEL.IMAGE_TAG, '?'),
                            ))


def augment_apply_command(args, parser=None):
    """
    Perform 'augment apply' command.
    """
    try:
        if args.augmentation_name is not None:
            aug_path = '/deploy/augment/' + args.augmentation_name + YAML_EXTENSION
            aug_name = args.augmentation_name
        else:
            aug_path = args.augmentation_file
            aug_name = args.augmentation_file

        cprint(f"Applying augmentation '{aug_name}' to {args.name[0]}...", color='cyan')
        aug_values = parse_augmentation_values(args.name[0], args.namevalue)
        aug = read_augmentation(aug_path, aug_values)

        if aug is not None:
            kubeobj = render_augmentation(aug, aug_values)
            logging.debug("rendered augmentation:\n" + kubeobj)
            if args.dry_run:
                print(kubeobj)
                run_command('kubectl apply --dry-run=client -f -', print_output=True, stdin=kubeobj)
                sys.exit(0)
            else:
                return_code, out, err = run_command('kubectl apply -f -', stdin=kubeobj)
                if return_code != 0:
                    print_error(f'Could not augment instance {args.name[0]}: {err}')
                    sys.exit(return_code)
        else:
            sys.exit(1)

    except Exception as e:
        print_error(f"Failed to apply augmentation '{aug_name}' to {args.name[0]}: {e}")
        traceback.print_exc()
        sys.exit(1)

    cprint(f"Augmentation '{aug_name}' successfully applied to {args.name[0]}", color='green', attrs=['bold'])


def augment_delete_command(args, parser=None):
    """
    Perform 'augment delete' command.
    """
    try:
        if args.augmentation_name is not None:
            aug_path = '/deploy/augment/' + args.augmentation_name + YAML_EXTENSION
            aug_name = args.augmentation_name
        else:
            aug_path = args.augmentation_file
            aug_name = args.augmentation_file

        cprint(f"Deleting '{aug_name}' from {args.name[0]}...", color='cyan')

        aug_values = parse_augmentation_values(args.name[0], args.namevalue)
        aug = read_augmentation(aug_path, aug_values)

        if aug is not None:
            kubeobj = render_augmentation(aug, aug_values)
            logging.debug("rendered augmentation:\n" + kubeobj)
            if args.dry_run:
                print(kubeobj)
                run_command('kubectl delete --dry-run=client -f -', print_output=True, stdin=kubeobj)
                sys.exit(0)
            else:
                return_code, out, err = run_command('kubectl delete -f -', stdin=kubeobj)
                if return_code != 0:
                    print_error(f'Could not delete augmentation from instance {args.name[0]}: {err}')
                    sys.exit(return_code)
        else:
            sys.exit(1)

    except Exception as e:
        print_error(f"Failed to delete augmentation '{aug_name}' from {args.name[0]}: {e}")
        sys.exit(1)

    cprint(f"Augmentation '{aug_name}' successfully deleted from {args.name[0]}", color='green', attrs=['bold'])


def augment_catalog_command(args, parser=None):
    """
    Perform 'augment catalog' command.
    """
    # Get list of all .yaml files in /deploy/augment directory
    filenames = [f for f in os.listdir('/deploy/augment') if f.endswith(YAML_EXTENSION)]

    augs = []
    if filenames:
        for f in filenames:
            a = read_augmentation(f'/deploy/augment/{f}')
            if a is not None:  # pragma: no branch
                a['name']   = f[:-(len(YAML_EXTENSION))]  # strip off yaml extension
                a['type']   = a.get('metadata', {}).get('type', 'none')
                a['labels'] = a.get('metadata', {}).get('labels', [])
                a['wait']   = a.get('metadata', {}).get('wait', [])
                # internal, don't need in json catalog                
                a.pop('template', None)
                a.pop('num_lines_before_template', None)
                augs.append(a)

    if args.json:
        print(json.dumps(augs, indent=3, sort_keys=True))

    else:  # human readable text
        col_format = '%-48s   %-8s   %-23s'
        print(col_format % ('NAME', 'TYPE', 'LABELS'))
        print(col_format % ('----', '----', '------'))
        for a in sorted(augs, key=itemgetter('type')):
            print(col_format % (a['name'], a['type'], ','.join(a.get('labels', []))))


def help_command(args, parser=None):
    parser.print_help()


# ---------- Other Helper Functions -----------------


def request_dataload(hostname, instance_name, endpoint='load', config_overrides=None, timeout=4):  # NOSONAR - refactoring would introduce (rather than reduce) complexity
    """
    Send HTTP request to the config-loader initiate a dataload
    :param hostname: FQDN of the kubernetes cluster where the config-loader service is running
    :param instance_name: Instance name to perform the dataload on
    :param endpoint: HTTP service target endpoint. Default is 'load'.
    :param config_overrides: Directory path for configuration overrides. Default is None.
    :param timeout: Timeout in minutes to wait for config-loader to be alive, and for dataload to complete.
    :return: True if dataload was successful, False otherwise.
    """

    cprint(f'Beginning dataload for {instance_name}', color='cyan')

    timeout_seconds = timeout * 60

    # check if config-loader service exists in the instance
    return_code, out, err = run_command(f'kubectl get service config-loader --namespace {instance_name}', print_output=False)
    if return_code > 0:
        logging.debug('config-loader service does not exist, skipping dataload')
        return True

    try:
        retry_strategy = Retry(total=20, backoff_factor=0.2, status_forcelist=[404], method_whitelist=["POST", "GET"])
        adapter = HTTPAdapter(max_retries=retry_strategy)
        http = requests.Session()
        http.mount("https://", adapter)

        # Check if the hostname against the dev vm, don't verify ssl cert for dev vm
        ssl_verify = True
        if hostname == "gms.cluster.local":  # pragma: no branch
            ssl_verify = False
            requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

        # must be https on kube cluster, and note the requests CA bundle env var must be set
        config_loader_url = f"https://{instance_name}.{hostname}/config-loader"

        if config_overrides is not None:
            override_file = get_override_tar_file(config_overrides)
            if override_file is None:
                print_error('Unable to create tar file from user supplied overrides')
                sys.exit(1)
            files = {'files': override_file}
        else:
            files = None

        cprint('Waiting for config loader to be alive...', color='magenta')
        time_waited = 0
        while time_waited < timeout_seconds:
            post_response = http.get(f"{config_loader_url}/alive", verify=ssl_verify, allow_redirects=False)

            if post_response.status_code == 200:
                break

            if time_waited % 30 == 0:  # pragma: no branch
                # print a message every 30 seconds noting that we are waiting.
                cprint('Waiting for config loader to be alive...', color='magenta')

            time.sleep(1)
            time_waited += 1

            if time_waited >= timeout_seconds:  # pragma: no branch
                print_warning('Timed out waiting for config loader to be alive, will attempt dataload anyway')

        cprint('Requesting dataload...', color='magenta')
        post_response = http.post(f"{config_loader_url}/{endpoint}", files=files, verify=ssl_verify)

        if post_response.status_code != 200:
            print_error(f'Failed to initiate a data load. {post_response.status_code}: {post_response.reason}')
            sys.exit(1)

        # Wait for results from the config-loader service
        time_waited = 0
        while time_waited < timeout_seconds:  # pragma: no branch
            result_response = json.loads(http.get(f"{config_loader_url}/result", verify=ssl_verify).text)
            if result_response['status'] == 'FINISHED':
                break

            if time_waited % 15 == 0:  # pragma: no branch
                # print a message every 15 seconds noting that we are waiting
                cprint('Waiting for data load to complete...', color='magenta')

            time.sleep(1)
            time_waited += 1

        if result_response['status'] != 'FINISHED':
            print_error(f'Timed out waiting for dataload after {timeout} minutes...Exiting')
            sys.exit(1)

        if result_response['successful']:
            print(result_response['result'])
            cprint('Data load successfully completed.', color='green')
            return True
        else:
            print(result_response['result'])
            print_error(f'Dataload failed to execute successfully...Exiting')
            sys.exit(1)

    except Exception as e:
        print_error(e)
        sys.exit(1)


def get_override_tar_file(config_dir):
    buffered_tarfile = None
    try:
        # This method will take the input config dir and create a tar file
        filelist = []
        dirlist = [f"{config_dir}/processing", f"{config_dir}/station-reference/stationdata", f"{config_dir}/user-preferences"]

        for override_dir in dirlist:
            if os.path.exists(override_dir):
                for root, dirs, files in os.walk(override_dir):
                    for name in files:
                        fullpathfilename = os.path.join(root, name)
                        subpathfilename = os.path.relpath(fullpathfilename, config_dir)
                        filelist.append(subpathfilename)

        # Change to the config override directory
        os.chdir(config_dir)

        # Create the tar file
        fh = io.BytesIO()
        with tarfile.open(fileobj=fh, mode='w:gz') as tar:
            for file in filelist:
                # ignore any filenames that start with '.'
                if not file.startswith('.'):
                    tar.add(file)

        buffered_tarfile = fh.getbuffer()

    except Exception as ex:
        print_error(f'{ex.explanation}')

    return buffered_tarfile


def get_instance_labels(name):
    """
    Gets the gms labels for a single instance
    :param name: Name of the instance
    :return: Dictionary with gms key value pairs representing the labels
    """
    return_code, out, err = run_command(f'kubectl get configmap --namespace {name} --field-selector metadata.name==gms '
                                        f'--show-labels --no-headers', print_output=False)

    try:
        labels = dict(item.split("=") for item in out.split()[3].split(","))
    except Exception as ex:
        logging.debug(f'Error splitting labels for configmap gms in namespace {name}: {ex}')
        labels = {}

    logging.debug(f'Labels for ConfigMap "gms" in Namespace "{name}"')
    logging.debug(labels)

    return labels


def get_all_labels():
    """
    Gets the gms labels for all instances (all namespaces)
    :return: List of Dictionaries with gms key value pairs representing the labels
    """
    return_code, out, err = run_command('kubectl get configmap --all-namespaces '
                                        '--field-selector metadata.name==gms --show-labels --no-headers', print_output=False)

    labels = []

    for line in out.splitlines():
        try:
            labels.append(dict(item.split("=") for item in line.split()[4].split(",")))
        except Exception as ex:
            logging.debug(f'Error while splitting labels for configmap gms: {line}, {ex}')

    logging.debug(f'Labels for ConfigMap "gms" in All namespaces')
    logging.debug(labels)

    return labels


def get_injector_livedata_set_args(injector, injector_dataset, livedata, connman_port, connman_data_manager_ip,
                                   connman_data_provider_ip, dataman_ports):
    """
    Returns a list containing set arguments needed for the injector or live data
    :param injector: boolean indicating if the injector should be enabled
    :param injector_dataset: name of the dataset for the injector
    :param livedata: boolean indicating if live data should be enabled
    :param connman_port: well known port for CD11 connman service
    :param connman_data_manager_ip: external IP address of the CD11 dataman service
    :param connman_data_provider_ip: IP address of the data provider sending data to the CD11 dataman service
    :param dataman_ports: port range for the CD11 dataman service
    :return: list with --set arguments for helm
    """

    cmd = []
    if injector:  # pragma: no branch
        cmd.extend(shlex.split(f'--set injector=True'))
    if injector_dataset is not None:  # pragma: no branch
        cmd.extend(shlex.split(f'--set "cd11-injector.env.CD11_INJECTOR_CONFIG_NAME={injector_dataset}"'))
    if livedata:  # pragma: no branch
        cmd.extend(shlex.split(f'--set "liveData=True"'))
    if connman_port is not None:  # pragma: no branch
        cmd.extend(shlex.split(f'--set "da-connman.connPort={connman_port}"'))
    if connman_data_manager_ip is not None:  # pragma: no branch
        cmd.extend(shlex.split(f'--set "da-connman.env.GMS_CONFIG_CONNMAN__DATA_MANAGER_IP_ADDRESS={connman_data_manager_ip}"'))
    if connman_data_provider_ip is not None:  # pragma: no branch
        cmd.extend(shlex.split(f'--set "da-connman.env.GMS_CONFIG_CONNMAN__DATA_PROVIDER_IP_ADDRESS={connman_data_provider_ip}"'))
    if dataman_ports is not None:  # pragma: no branch
        cmd.extend(shlex.split(f'--set "da-dataman.dataPortStart={dataman_ports.split("-")[0]}"'))
        cmd.extend(shlex.split(f'--set "da-dataman.dataPortEnd={dataman_ports.split("-")[1]}"'))

    return cmd


def create_oracle_wallet_secret(oracle_wallet_path, namespace):
    """
    Creates a new secret using the oracle_wallet_path, or copies the default secret
    if oracle_wallet_path is None
    :param oracle_wallet_path: path to the Oracle Wallet directory
    :param namespace: the target namespace where the secret will be created
    :return: None
    """

    if oracle_wallet_path is None:
        # copy the shared secret from gms namespace
        print('Copying oracle-wallet shared secret from gms namespace')
        return_code, out, err = run_command(f'kubectl get secret oracle-wallet --namespace gms -o yaml', print_output=False)
        if return_code > 0:
            print_error(f'Unable to get shared secret in gms namespace: {err}')
            exit(return_code)

        # replace gms namespace with the target namespace
        secret_str = out.replace('namespace: gms', f'namespace: {namespace}')

        # apply the yaml
        return_code, out, err = run_command(f'kubectl --namespace {namespace} apply -f -', stdin=secret_str, print_output=True)
        if return_code > 0:
            print_error(f'Unable to create oracle-wallet secret in {namespace}')
            exit(return_code)
    else:
        # create the secret from the supplied path
        print('Creating oracle-wallet secret using the supplied --wallet path')
        if not os.path.isdir(oracle_wallet_path):
            print_error(f'The specified --wallet path ({oracle_wallet_path}) is not a directory...Exiting')
            sys.exit(1)

        return_code, out, err = run_command(f'kubectl --namespace {namespace} create secret generic oracle-wallet '
                                            f'--from-file={oracle_wallet_path}', print_output=True)

        if return_code > 0:
            print_error(f'Unable to create oracle-wallet secret in {namespace}')
            exit(return_code)


def parse_document_kind(document):
    """
    Brute-force parsing of document string to look for 'kind: value' and parse out the value
    :param document: Document to parse
    :return: the value parsed
    """
    kind = None
    for line in document.splitlines():
        if 'kind' in line:
            match = re.match(r"^\s*kind\s*:\s*(\w*)\s*", line)
            if match:
                kind = match.group(1)
    return kind


def read_augmentation(aug_path, aug_values=[]):  # NOSONAR - refactoring would introduce (rather than reduce) complexity
    """
    Read an 'augmentation' object from a kubernetes object file. The first yaml
    document in the file must be a special "kind: Augmentation" object.
    Note that this is a GMS-specific object that is not understood by Kubernetes,
    so we will read it to get its metadata and strip it off to get the rest of
    the augmentation template.
    :param aug_path: full path to the augmentation file
    :return: dictionary with augmentation metadata and 'template' value containing augmentation template
    """
    augmentation = None
    try:
        filename = os.path.basename(aug_path)

        # -------------------------------------------------------------
        # Split on '---' to separate out the first yaml document (which
        # MUST be the Augmentation).
        #
        # (0) anything before
        #     ---
        # (1) kind: Augmentation
        #     ...
        #     ---
        # (2) everything else
        #     ...
        #
        # The pyyaml library will FAIL to arse anything with Jinja 
        # templates (which will be in section (2)), so we need to do
        # this with a regex split.
        # -------------------------------------------------------------
        with open(aug_path, 'r') as file:
            documents = re.split(r"^---\s*\n", file.read(), maxsplit=2, flags=re.DOTALL | re.MULTILINE)

        if len(documents) != 3:
            print_error(f"Augmentation '{filename}' must contain at least two YAML documents with the first being 'kind: Augmentation'")
            return None

        # If document (0) is 'Augmentation', we might be missing the initial '---'
        if parse_document_kind(documents[0]) == "Augmentation":
            print_error(f"Augmentation '{filename}'. Document missing leading '---'")
            return None

        # Ensure document (1) is the 'Augmentation' kind 
        kind = parse_document_kind(documents[1])
        if kind is not None:
            if kind != "Augmentation":
                print_error(f"First document in '{filename}' must be 'kind: Augmentation' instead of 'kind: {kind}'")
                sys.exit(1)
        else:
            print_error(f"First document in '{filename}' must specify 'kind: Augmentation'")
            return None

        # Render the Augmentation document to expand any variables used there
        rendered_template = render_jinja_template(documents[1], aug_values)

        # Load the rendered yaml into a dictionary
        augmentation = yaml.safe_load(rendered_template)
        augmentation['filename'] = filename
        augmentation['template'] = "---\n" + documents[2]

        # Count the number of lines in (0) and (1) for better jinja error reporting later
        augmentation['num_lines_before_template'] = documents[0].count('\n') + documents[1].count('\n') + 2  # +2 for '---' lines

    except yaml.YAMLError as e:
        print_error(f"Failed to parse Augmentation document from Kubernetes object file '{filename}' {e}")
    except Exception as e:
        print_error(f"Failed to read Augmentation from Kubernetes object file '{filename}' {e}")

    return augmentation


def render_augmentation(augmentation, aug_values=None):
    """
    Render an 'augmentation' object given the dictionary of key/values.
    :param augmentation: dictionary read from read_augmentation
    :param aug_values: dictionary of augmentation template variable values
    :return: rendered augmentation kubernetes document
    """
    if aug_values is None:  # sonarqube complains if default arg is '{}'
        aug_values = {}

    rendered_template = None
    try:
        # Merge the augmentation values into our base set of template values
        if 'metadata' in augmentation:
            aug_values['augmentationType'] = augmentation['metadata'].get('type', 'unspecified')
            aug_values.update(augmentation['metadata'].get('values', None))

        rendered_template = render_jinja_template(augmentation['template'], aug_values)

    except jinja2.exceptions.UndefinedError as e:
        print_error(f"{e.message} in \'{augmentation['filename']}\'")
        sys.exit(1)
    except jinja2.exceptions.TemplateSyntaxError as e:
        print_error(f"Template error in \'{augmentation['filename']}\': {e.lineno + augmentation['num_lines_before_template']} {e.message}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Failed to open Kubernetes object file \'{augmentation['filename']}\': {e} {type(e)}")
        sys.exit(1)

    return rendered_template


def parse_augmentation_values(namespace, namevalue):
    """
    Parse --set arguments into a dictonary usable by the Jinja2 Augmentation templating.
    :param namespace: namespace of running instance to gather metadata from
    :param namevalue: list of name=value items gathered from the --set command-line arguments
    :return: dictionary of namevalue pairs, with names of the form 'env.name' separated out into a 'env' sub-dictionary
    """
    values = {'env': {}}

    image_tag = get_instance_labels(namespace).get(LABEL.IMAGE_TAG, None)
    if image_tag is None:
        print_error(f"Unable to locate instance '{namespace}' to determine 'image-tag'.  Is this instance running?")
        sys.exit(1)

    instance_type = get_instance_labels(namespace).get(LABEL.TYPE, None)
    if image_tag is None:
        print_error(f"Unable to locate instance '{namespace}' to determine 'type'.  Is this instance running?")
        sys.exit(1)

    values['namespace'] = namespace
    values['imageTag'] = image_tag
    values['instanceType'] = instance_type
    values['baseDomain'] = os.getenv('KUBECTL_HOST')
    values['imageRegistry'] = os.getenv('CI_DOCKER_REGISTRY')
    values['userName'] = getpass.getuser()

    if namevalue is not None:
        for item in namevalue:
            name, value = item.split('=', 1)
            # Parse out *.env.name=value items into an 'env' subdictionary'
            match = re.match(r"^([^.]+)?\.?env\.(.*)$", name)
            if match:
                if match.group(1):
                    print_warning(f"Application envionment variables not used for augmentation. Setting '{item}' globally")
                    values['env'][match.group(2)] = value
                else:
                    values['env'][match.group(2)] = value
            else:
                values[name] = value

    return values


def run_command(command, print_output=True, stdin=None):
    """
    Execute the specified system command. This will always be executed with /deploy as the PWD.
    :param command: The command string or list to execute. It is best to build this with shlex.split(), but if you don't it will be done internally.
    :param print_output: If True, print the stdout from the command
    :param stdin: The optional "input" argument should be data to be sent to the child process, or None, if no data should be sent to the child.
    :return: A tuple of the command return code, stdout string, and stderr string
    """

    if type(command) is not list:
        command = shlex.split(command)

    logging.debug(f'Running command: {" ".join(command)}')

    # always change to /deploy since this is where helm expects to be running
    # For debugging, you can either create /deploy on your machine, create a soft-link, or temporarily change this value
    # This is hardcoded to prevent a critical fortify finding
    os.chdir("/deploy")

    cmd = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE)
    out, err = cmd.communicate(input=(stdin.encode() if stdin else None))
    out = out.decode()
    err = err.decode()

    if print_output:
        print(f'{out}')
        if len(err) > 0:
            print_warning(f'{err}')

    return cmd.returncode, out, err


def print_warning(message):
    """
    Print a warning message in bold yellow.
    :param message: Message string to print
    """
    cprint(f'[WARNING] {message}', color='yellow', attrs=['bold'])


def print_error(message):
    """
    Print an error message in bold red.
    :param message: Message string to print
    """
    cprint(f'[ERROR] {message}', color='red', attrs=['bold'])


def handler(signal_received, frame):
    # Handle any cleanup here
    sys.exit(0)


def render_jinja_template(document, values):
    """
    Helper function to render a jinja template, resolving with the given set of key-value variables.
    :param document: Document template to render
    :param values: Dictionary of key-value variable definitions
    """
    jinja_env = jinja2.Environment(undefined=jinja2.StrictUndefined, autoescape=True)
    jinja_env.filters['b64enc'] = b64enc_filter
    jinja_env.filters['b64dec'] = b64dec_filter
    template = jinja_env.from_string(document)
    return template.render(values)


def b64enc_filter(s):
    """Jinja2 b64enc filter"""
    return base64.b64encode(s.encode('ascii')).decode('ascii')


def b64dec_filter(s):
    """Jinja2 b64dec filter"""
    return base64.b64decode(s.encode('ascii')).decode('ascii')


if __name__ == "__main__":
    # register SIGINT handler for ctl-c
    signal(SIGINT, handler)

    main()
