import http from 'http';

// reference to `http`
const https = http;

// reference to the `create server` method
// eslint-disable-next-line @typescript-eslint/dot-notation, dot-notation
const internalCreate = https[`createServer`];

// The Server
export type Server = http.Server;

// export of create server method
export const create = internalCreate;
