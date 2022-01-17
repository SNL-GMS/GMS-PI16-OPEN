from setuptools import setup, find_packages

'''
To rebuild, run python3 setup.py
'''

VERSION = '0.1.0'

setup(
    name='gmskube',
    version=VERSION,
    description='A command line application to manage gms instances on Kubernetes',
    packages=find_packages(),
    scripts=['gmskube/gmskube.py'],
    python_requires='>=3.7',
    install_requires=['jinja2==2.11.3',
                      'pyyaml==5.3',
                      'requests==2.22.0',
                      'termcolor==1.1.0']
)
