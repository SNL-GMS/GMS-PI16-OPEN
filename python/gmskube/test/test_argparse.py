import argparse

import pytest
from gmskube import gmskube


def test_get_args(mocker):
    mocker.patch('argparse.ArgumentParser.parse_args', return_value=argparse.Namespace())
    parser = gmskube.get_parser()
    gmskube.get_args(parser)


def test_argparse_instance_name_type_pass():
    gmskube.argparse_instance_name_type("test-1234")


def test_argparse_instance_name_type_fail():
    with pytest.raises(argparse.ArgumentTypeError):
        gmskube.argparse_instance_name_type("awesome@_test")


def test_argparse_tag_name_type():
    ret = gmskube.argparse_tag_name_type('-MyBranchName_1234567890123456789012345678901234567890')
    assert ret == 'mybranchname-1234567890123456789012345678901234567890'


def test_argparse_set_type_pass():
    gmskube.argparse_set_type('label=value')


def test_argparse_set_type_fail():
    with pytest.raises(argparse.ArgumentTypeError):
        gmskube.argparse_set_type('=value')


def test_argparse_ip_address_type_pass():
    gmskube.argparse_ip_address_type('192.168.1.1')  # NOSONAR: ip address for testing


def test_argparse_ip_address_type_fail():
    with pytest.raises(argparse.ArgumentTypeError):
        gmskube.argparse_ip_address_type('192.168.not.valid')


def test_argparse_dataman_ports_type_pass():
    gmskube.argparse_dataman_ports_type('8080-8081')


def test_argparse_dataman_ports_type_fail():
    with pytest.raises(argparse.ArgumentTypeError):
        gmskube.argparse_dataman_ports_type('9090')
