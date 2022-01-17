import config from 'config';
import { Express } from 'express';

import { gatewayLogger as logger } from '../log/gateway-logger';
import { create, Server } from './http-https';

/**
 * Creates the HTTP server
 *
 * @param app the express server
 */
export const createHttpServer = (app: Express): Server => {
  logger.info(`Creating the http server...`);

  // Load configuration settings
  const gqlConfig = config.get('server.graphql');

  // GraphQL Path
  const { graphqlPath } = gqlConfig.http;
  logger.info(`graphqlPath ${graphqlPath}`);

  // GraphQL HTTP server port
  const httpPort = gqlConfig.http.port;
  logger.info(`httpPort ${httpPort}`);

  // GraphQL Websocket port
  const wsPort = gqlConfig.ws.port;
  logger.info(`wsPort ${wsPort}`);

  const server: Server =
    // Listen for GraphQL requests over HTTP
    create(app);

  server.listen(httpPort, () => {
    logger.info(`listening on port ${httpPort}`);
  });

  return server;
};
