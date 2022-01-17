# Augmentations

This directory contains various *augmentations* that can be applied to
a running GMS instance. An *augmentation* consists of a related set of
Kubernetes objects collected into a single YAML file. This directory
is packaged up in the `gmskube` container so that these augmentations
are available to be applied directly to running instances.

## gmskube Commands

* `gmskube augment catalog`<br>
  Lists the available augmentations from this directory.

* `gmskube augment apply`<br>
  Apply any one of the augmentations from this directory to a running
  instance.

* `gmskube augment apply`<br>
  Delete any of the augmentations from this directory that was
  previously applied to a running instance.

## Augmentation Object

The first YAML document in the augmentation file *must* be a special
`kind: Augmentation` object. This is a GMS-specific object that is not
natively understood by Kubernetes, but we use it identify the file and
provide various augmentation-specific metadata.

A `type` may be specified that indicates how the augmentation would be
typically be used.  Augmentations are generally test-related and are
categorized as either being a *harness* or *test*.

* A *harness* typicially would either be a data simulator or data
  preloader that runs before a test or runs continuously in the
  background during a test.

* A *test* typically would be a Kubernetes `Job` that runs a specific
  series of actions against a deployment and returns a "success" or
  "failure" status.

A list of `tags` may also be supplied which can be used to further
describe the augmentation.  The automated system test driver may use
these tags to gate which tests to be run for specific purposes
(e.g. "Run the `ian` `smoke` tests against a given instance.")

```yaml
kind: Augmentation
metadata:
  type: harness  
  values:
    appName: data-simulator
    imageName: gms-common/data-simulator
    data:
      waveforms: "/data/waveforms"
      responses: "/data/responses"
  tags:  
    - ian
    - sim
```
## Templating

The *augmentation* files may use Jinja2 templates. The templating is
primarly used for variable substitution.

For example, if the variable `machineType` is set to the value
`Mystery`, this text: 
```
Look out, it is the {{ machineType }} Machine!
```
expands to:
```
Look out, it is the Mystery Machine!
```

> Note this template syntax differs slightly from the Golang templates
> used in the main helm charts. Be aware of this if moving content
> between charts and augmentations.

A number of variables are defined by `gmskube`:

| Variable           | Value |
|:-------------------|:---------------------------------------------------------------------|
| `namespace`        | The instance name specified for the augmentation.                    |
| `baseDomain`       | The base network domain derived from the kubernetes configuration.   |
| `imageRegistry`    | The value of the `CI_DOCKER_REGISTRY` environment variable.          |
| `imageTag`         | The `gms/image-tag` label set for the namespace.                     |
| `userName`         | The current username running the gmskube command.                    |
| `augmentationKind` | The `kind` of augmentation as specified in the *augmentation* object |

Additional variables can be defined in the `values` section of the
*augmentation* object at the start of the augmentation
file. Typically, the variables `appName` and `imageName` should be
defined here as those values often occur in multiple locations
throughout the augmentation file.
