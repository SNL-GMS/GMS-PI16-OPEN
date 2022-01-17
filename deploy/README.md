# Overview

This directory contains charts for different configurations of the GMS
system:

* **ian** - Interactive Analysis (IAN) data bridge and analyst tools
* **soh** - Station State-of-Health (SOH) Monitoring

The `gmskube` script should be used to start instances of these
charts. The `gmskube` script will provide the myriad of key/value
settings required for these charts. It will also coordinate the
configuration loading required to bootstrap the system at startup.

A running instance can be augmented via additional tests and test
harnesses defined in the [`augment`](./augment) subdirectory.

# Install and configure tools

## Install `kubectl` and `helm`

First you need to install relatively modern versions of the `kubectl` and `helm` CLI programs.

### Mac with Homebrew

```sh
brew update
brew install kubectl helm
```

### Mac without Homebrew

```sh
wget https://storage.googleapis.com/kubernetes-release/release/v1.18.6/bin/darwin/amd64/kubectl
chmod a+x kubectl

wget https://get.helm.sh/helm-v3.2.4-darwin-amd64.tar.gz
tar -xzvf helm-v3.2.4-darwin-amd64.tar.gz --strip-components 1 darwin-amd64/helm
```

### Linux Developer VM

```sh
wget https://storage.googleapis.com/kubernetes-release/release/v1.18.6/bin/linux/amd64/kubectl
chmod a+x kubectl

wget https://get.helm.sh/helm-v3.2.4-linux-amd64.tar.gz
tar -xzvf helm-v3.2.4-linux-amd64.tar.gz --strip-components 1 linux-amd64/helm
```

## Connect to a Kubernetes cluster

Next you need to configure `kubectl` to talk to a Kubernetes cluster.

### Rancher

1. Login to the Rancher interface for the cluster you will be using.
1. Click on the cluster name in the list
1. In the upper right, click on the blue **Kubeconfig File** button.
1. Copy/paste the provided file contents into `~/.kube/config` on your Mac or Developer VM.
1. Run `kubectl get all` and `helm list` to confirm that things are working.

# Example SOH Chart usage

```sh
# List all running charts.
helm list

# Run the 'soh' chart, naming the instance 'my-soh'.  All objects will be placed into the 'my-soh' namespace.
# If '--set imageTag=' is not provided, the default is 'develop'.
# See the soh/values.yaml file for other defaults.
helm install my-soh soh
helm install my-soh soh --set imageTag=my-branch

# Update the existing soh chart instance named 'my-soh' to match the latest 'soh' chart definition and values.
# If '--set imageTag=' is not provided, the default is 'develop'.
# See the soh/values.yaml file for other defaults.
helm upgrade my-soh soh
helm upgrade my-soh soh --set imageTag=my-branch
helm upgrade my-soh soh --set imageTag=develop

# Setting global and per-app environment variables.
helm install my-soh soh --set env.GLOBAL_VAR="Hello World" --set da-connman.env.GLOBAL_VAR="Hello Connman" --set da-connman.env.GMS_CONFIG_CONNMAN__CONNECTION_MANAGER_WELL_KNOWN_PORT=8043

# One way to scale services down/up.
helm upgrade my-soh soh --set bastion.replicas=0
helm upgrade my-soh soh --set bastion.replicas=1

# If '--dry-run' is added to install/upgrade commands, the the rendered Kubernetes
# manifest YAML will be printed to stdout and no changes will be made to the cluster.
helm upgrade my-soh soh --set bastion.replicas=0 --dry-run

# View history.
helm history my-soh

# Rollback to a previous revision.
helm rollback my-soh 1

# Remove the 'my-soh' instance.
helm uninstall my-soh
```

# More handy commands

```sh
# Watch all of the objects in your namespace.
watch kubectl get all -n my-soh

# Scale a deployment down/up (without helm).
kubectl scale -n my-soh --replicas 0 deployment/etcd
kubectl scale -n my-soh --replicas 1 deployment/etcd

# Exec into the bastion container.
kubectl exec -n my-soh -it deployment/bastion -- bash
```
