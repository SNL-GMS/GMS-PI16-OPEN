from setuptools import setup, find_packages

'''
To rebuild, run python3 setup.py
'''

VERSION = '0.1.0'

setup(
    name='config-loader',
    version=VERSION,
    description='Application for the loading of the config into the GMS',
    packages=find_packages(),
    python_requires='>=3.7',
    install_requires=['flask==1.1.2',
                      'gunicorn==20.0.4',
                      'pyyaml==5.3',
                      'simplejson==3.7.2',
                      'flask-sqlalchemy==2.4.0',
                      'flask-sqlalchemy-session==1.1',
                      'flask-executor==0.9.3',
                      'requests==2.22.0']
)
