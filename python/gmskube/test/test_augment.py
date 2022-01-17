import argparse
import os

from gmskube import gmskube


def get_test_augment_file_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resources/augmentation/test_augment.yaml')


def test_augment_apply_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('gmskube.gmskube.get_instance_labels', return_value={'gms/image-tag': 'test'})
    mocker.patch('gmskube.gmskube.parse_augmentation_values', return_value={})
    mocker.patch('gmskube.gmskube.read_augmentation', return_value="test")
    mocker.patch('gmskube.gmskube.render_augmentation', return_value="test")
    mocker.patch('os.chdir', return_value=True)
    args = argparse.Namespace(name=["test"], augmentation_name=None, dry_run=False, namevalue=None, augmentation_file=get_test_augment_file_path())
    gmskube.augment_apply_command(args)


def test_augment_delete_command(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('gmskube.gmskube.get_instance_labels', return_value={'gms/image-tag': 'test'})
    mocker.patch('gmskube.gmskube.parse_augmentation_values', return_value={})
    mocker.patch('gmskube.gmskube.read_augmentation', return_value="test")
    mocker.patch('gmskube.gmskube.render_augmentation', return_value="test")
    args = argparse.Namespace(name=["test"], augmentation_name=None, dry_run=False, namevalue=None, augmentation_file=get_test_augment_file_path())
    gmskube.augment_delete_command(args)


def test_augment_catalog_command(mocker):
    mocker.patch('gmskube.gmskube.read_augmentation', return_value={'template': ''})
    mocker.patch('os.listdir', return_value=['test_augment.yaml'])
    args = argparse.Namespace(name=["test"], json=False)
    gmskube.augment_catalog_command(args)


def test_parse_document_kind():
    ret = gmskube.parse_document_kind("kind: test")
    assert ret == "test"


def test_read_augmentation(mocker):
    mocker.patch('os.chdir', return_value=True)
    gmskube.read_augmentation(get_test_augment_file_path())


def test_render_augmentation():
    gmskube.render_augmentation({'template': ''})


def test_parse_augmentation_values_none(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('sys.exit', return_value=True)
    gmskube.parse_augmentation_values('name', None)


def test_parse_augmentation_values(mocker):
    mocker.patch('gmskube.gmskube.run_command', return_value=(0, "", ""))
    mocker.patch('sys.exit', return_value=True)
    gmskube.parse_augmentation_values('name', ['key=value', 'test.env.key=value'])
