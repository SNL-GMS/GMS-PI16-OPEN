import argparse
import os
import shlex

import pytest
import requests
from gmskube import gmskube


def get_test_oracle_wallet_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resources/oracle-wallet')


def test_main(mocker, monkeypatch):
    mocker.patch('gmskube.gmskube.get_args', return_value=argparse.Namespace(verbose='DEBUG', command=(lambda *args: None)))
    mocker.patch('logging.basicConfig', return_value=None)
    mocker.patch('builtins.open', new_callable=mocker.mock_open)
    monkeypatch.setenv('KUBECTL_CONTEXT', 'test')
    monkeypatch.delenv('REQUEST_CA_BUNDLE', raising=False)
    gmskube.main()


def test_uninstall_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    args = argparse.Namespace(name=["test"], timeout=4)
    gmskube.uninstall_command(args)


def test_install_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('gmskube.gmskube.request_dataload', return_value=True)
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=["name=value"], injector=True,
                              injector_dataset="test", livedata=True, connman_port="123", connman_data_manager_ip="127.0.0.1",
                              connman_data_provider_ip="127.0.0.1", dataman_ports="123-456", oracle_wallet=get_test_oracle_wallet_path(),
                              chart=None, type="soh", tag="test", config="", dry_run=False, istio=False, no_create_namespace=False)
    gmskube.install_command(args)


def test_install_command_dry_run(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=None, injector=False,
                              injector_dataset=None, livedata=False, connman_port=None, connman_data_manager_ip=None,
                              connman_data_provider_ip=None, dataman_ports=None, oracle_wallet=None,
                              chart=None, type="soh", tag="test", config=None, dry_run=True, istio=False, no_create_namespace=False)

    # dry-run causes a SystemExit
    with pytest.raises(SystemExit):
        gmskube.install_command(args)


def test_install_command_istio(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('gmskube.gmskube.request_dataload', return_value=True)
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=None, injector=False,
                              injector_dataset=None, livedata=False, connman_port=None, connman_data_manager_ip=None,
                              connman_data_provider_ip=None, dataman_ports=None, oracle_wallet=None,
                              chart=None, type="soh", tag="test", config=None, dry_run=False, istio=True, no_create_namespace=False)

    gmskube.install_command(args)


def test_install_command_no_create_namespace(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('gmskube.gmskube.request_dataload', return_value=True)
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=None, injector=False,
                              injector_dataset=None, livedata=False, connman_port=None, connman_data_manager_ip=None,
                              connman_data_provider_ip=None, dataman_ports=None, oracle_wallet=None,
                              chart=None, type="soh", tag="test", config=None, dry_run=False, istio=False, no_create_namespace=True)

    gmskube.install_command(args)


def test_upgrade_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=["name=value"], injector=True,
                              injector_dataset="test", livedata=True, connman_port="123", connman_data_manager_ip="127.0.0.1",
                              connman_data_provider_ip="127.0.0.1", dataman_ports="123-456",
                              chart="test", tag="test", dry_run=False)

    # dry-run for upgrade does not exit like install does
    gmskube.upgrade_command(args)


def test_upgrade_command_dry_run(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=None, injector=False,
                              injector_dataset=None, livedata=False, connman_port=None, connman_data_manager_ip=None,
                              connman_data_provider_ip=None, dataman_ports=None,
                              chart="test", tag="test", dry_run=True)
    gmskube.upgrade_command(args)


def test_upgrade_command_unable_to_determine_instance_type(mocker, capsys):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    args = argparse.Namespace(name=["test"], timeout=4, namevalue=None, injector=False,
                              injector_dataset=None, livedata=False, connman_port=None, connman_data_manager_ip=None,
                              connman_data_provider_ip=None, dataman_ports=None,
                              chart=None, tag="test", dry_run=False)

    with pytest.raises(SystemExit):
        gmskube.upgrade_command(args)

    out, err = capsys.readouterr()
    assert 'Could not determine the type for instance' in out


def test_reconfig_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('gmskube.gmskube.request_dataload', return_value=True)
    args = argparse.Namespace(name=["test"], timeout=4, config="test")
    gmskube.reconfig_command(args)


def test_list_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('json.loads', return_value=[{'name': 'test', 'status': 'dead'}])
    mocker.patch('gmskube.gmskube.get_all_labels', return_value=[{'gms/name': 'test', 'gms/cd11-live-data': 'true', 'gms/cd11-connman-port': '1234',
                                                                  'gms/cd11-dataman-port-start': '2345', 'gms/cd11-dataman-port-end': '3456'}])
    args = argparse.Namespace(user=None, type=None, all=False)
    gmskube.list_command(args)


def test_request_data_load(mocker):
    response200 = requests.Response()
    response200.status_code = 200
    response500 = requests.Response()
    response500.status_code = 500
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('requests.Session.get', return_value=response500)
    mocker.patch('requests.Session.post', return_value=response200)
    mocker.patch('json.loads', return_value={'status': 'FINISHED', 'successful': 'true', 'result': 'poop'})
    gmskube.request_dataload(hostname="gms.cluster.local", instance_name="test", timeout=0.016)


def test_get_override_tar_file(mocker):
    mocker.patch('os.path.exists', return_value=False)
    mocker.patch('os.chdir', return_value=True)
    gmskube.get_override_tar_file(config_dir="test")


def test_get_instance_labels(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "gms   0     30h   key=value", ""))
    gmskube.get_instance_labels(name="test")


def test_get_all_labels(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "testpoop    gms   0     30h   key=value", ""))
    gmskube.get_all_labels()


def test_run_command_string(mocker):
    mocker.patch('os.chdir', return_value=None)
    ret, out, err = gmskube.run_command('echo "test"', print_output=True)
    assert ret == 0
    assert out == 'test\n'
    assert err == ''


def test_run_command_no_print_output(mocker, capsys):
    mocker.patch('os.chdir', return_value=None)
    ret, out, err = gmskube.run_command(shlex.split('echo "test"'), print_output=False)
    assert ret == 0
    assert out == 'test\n'
    assert err == ''

    stdout, stderr = capsys.readouterr()
    assert 'test\n' not in stdout
    assert 'test\n' not in stderr


def test_run_command_print_output(mocker, capsys):
    mocker.patch('os.chdir', return_value=None)
    ret, out, err = gmskube.run_command(shlex.split('echo "test"'), print_output=True)
    assert ret == 0
    assert out == 'test\n'
    assert err == ''

    stdout, stderr = capsys.readouterr()
    assert 'test\n' in stdout
    assert 'test\n' not in stderr


def test_run_command_print_output_error(mocker):
    mocker.patch('os.chdir', return_value=None)
    with pytest.raises(FileNotFoundError):
        gmskube.run_command(shlex.split('boguscmd'), print_output=True)


def test_create_oracle_wallet_secret_copy(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    gmskube.create_oracle_wallet_secret(None, 'test')
    # nothing to really test here since everything is handled by kubectl


def test_create_oracle_wallet_secret_dir(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    gmskube.create_oracle_wallet_secret(get_test_oracle_wallet_path(), 'test')
    # nothing to really test here since the secret gets created by kubectl
