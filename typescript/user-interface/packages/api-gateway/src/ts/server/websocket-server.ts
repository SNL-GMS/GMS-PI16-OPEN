import config from 'config';
import cookie from 'cookie';
import { execute, GraphQLSchema, subscribe } from 'graphql';
import { ConnectionContext, SubscriptionServer } from 'subscriptions-transport-ws';

import { UserContext } from '../cache/types';
import { gatewayLogger as logger } from '../log/gateway-logger';
import { ExpressUserMap, UNDEFINED_USER } from './express-user';
import { create, Server } from './http-https';

/**
 * Creates the HTTP server
 *
 * @param schema the schema
 * @param userMap the user map
 */
export const createWebSocketServer = (schema: GraphQLSchema, userMap: ExpressUserMap): Server => {
  logger.info(`Creating the web socket server...`);

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

  const handleWebSocket = (request, response) => {
    const responseCode = 404;
    response.writeHead(responseCode);
    response.end();
  };

  const websocketServer: Server =
    // Create the Websocket server supporting GraphQL subscriptions over WS
    create(handleWebSocket);

  // Listen for GraphQL subscription connections
  websocketServer.listen(wsPort, () => {
    // Create the subscription server
    // eslint-disable-next-line no-new
    new SubscriptionServer(
      {
        schema,
        execute,
        subscribe,
        onConnect: (
          // eslint-disable-next-line @typescript-eslint/ban-types
          connectionParams: Object,
          webSocket: WebSocket,
          context: ConnectionContext
        ): UserContext => {
          const sessionIdRaw: string = cookie.parse(context.request.headers.cookie)
            .InteractiveAnalysis;
          const sessionId = sessionIdRaw.split(':')[1].split('.')[0];
          // TODO return string 'undefined' to avoid analyst.userName error in workflow
          // TODO - this case is hit when using firefox, more debugging is needed to get this fixed properly
          return {
            sessionId,
            // eslint-disable-next-line max-len
            userName:
              userMap.has(sessionId) && userMap.get(sessionId).userName
                ? userMap.get(sessionId).userName
                : UNDEFINED_USER,
            userRole: 'DEFAULT'
          };
        }
      },
      {
        server: websocketServer,
        path: gqlConfig.ws.path
      }
    );
    logger.info(`Websocket Server is listening on port ${wsPort}`);
  });

  return websocketServer;
};
