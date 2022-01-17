# GMS Mock Data Server

This package specifies and bundles an Express web server that serves data from JSON files, which can be used to mock the real backend services.  It is a custom use of [json-server](https://github.com/typicode/json-server) that:

1. Allows for HTTP POSTS to query information without mutating the mock data
1. Allows certain verbs to used at the end of the path instead of the method itself

## Running the Server

The mock server can be run within a Docker container or with Yarn.

### Running in Docker

To run a mock server, expose it at http://localhost:3001, and delete the container after exiting, run:

```sh
docker run --init -p 3001:3000 --name mock-server --rm gms-common/mock-data-server:develop
```

### Running with Yarn

To run the mock server on a local Node distribution, execute:

```sh
yarn && yarn build && yarn start
```

The mock server supports a few environment variables:

* `MOCK_FILE`, the JSON file that contains mock data. Defaults to "mock.json".
* `MOCK_SERVER_PORT`, the TCP port that the mock web server will bind to. Defaults to 3000, though `yarn start` sets it to 3001 so that api-gateway can use 3000.

## Updating the Mock File
The mock file (mock.json) is only meant to be updated when explicitly told to do so. As a result, we have added the file to git
in the following way, `git update-index --assume-unchanged mock.json`. Any changes you make to the file will not be added to version control unless you run this command: `git update-index --no-assume-unchanged path/to/file.txt`.
