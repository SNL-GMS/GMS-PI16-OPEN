# GMS Common Python Code

## Unit tests
Any unit tests for python must be in a directory named "test" (sonarqube is setup
to recognize tests that are contained in "test" directories). Be sure to update
the `.gitlab-ci.yml` job for any new python unit tests to ensure tests are run in the pipeline,
and coverage information is collected.

## Development environment
GMS uses **conda** for managing Python packages in a **gms**
development environment.

* Perform this one-time setup step to build a **conda** development environment for **gms**:
  ```bash
  conda env create environment.yml
  ```
  > NOTE: This may take some time to complete. Be patient.

* To activate the environment:
  ```bash
  conda activate gms
  ```
* Changes to the [`environment.yml`](./environment.yml) file require a rebuild of 
  the **conda** environment:
  ```bash
  conda env update environment.yml

* The **gms** environment can be removed using these commands:
  ```bash
  conda deactivate
  conda env remove -n gms
  ```

## Production environment
Modules should not rely on **conda** for their dependencies. Each module should have a
`setup.py` file that defines the dependencies. When installing, the user will run
`python setup.py install`. This is also how modules should be installed inside of Docker
containers.
