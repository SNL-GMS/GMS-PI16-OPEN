import * as Express from 'express';
import * as jsonServer from 'json-server';
// TODO: change to lodash specific imports to reduce bundle size.
import last from 'lodash/last';
import pull from 'lodash/pull';

const server = jsonServer.create();

const mockFile = process.env.MOCK_FILE || 'mock.json';
const port = process.env.MOCK_SERVER_PORT || '3000';

const router = jsonServer.router(mockFile);
const middlewares = jsonServer.defaults();
export const proxyRedirection = (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
): void => {
  if (req.method === 'POST') {
    if (last<string>(req.url.split('/')).toLowerCase() === 'store') {
      const paths = req.url.split('/').map(x => x.toLowerCase());
      req.url = pull(paths, 'store').join('/');
      // For the ui-processing-configuration-service two different
      // requests (ui.analyst-settings, ui.common-settings and
      // station-definition-manager.station-group-names) based on
      // request body (data) added to the mock.json to return three different
      // requests "ui-processing-configuration-service-ui.analyst-settings",
      // "ui-processing-configuration-service-ui.common-settings" and
      // "ui-processing-configuration-service-station-definition-manager.station-group-names"
    } else if (last<string>(req.url.split('/')).toLowerCase() === 'resolve') {
      const paths = req.url.split('/').map(x => x.toLowerCase());
      req.url = `${pull(paths, 'resolve').join('/')}-${req.body.configName}`;
      req.method = 'GET';
    } else if (
      last<string>(req.url.split('/')) === 'retrieve-station-soh-monitoring-ui-client-parameters'
    ) {
      const paths = req.url.split('/').map(x => x.toLowerCase());
      req.url = pull(paths, 'ssam-control').join('/');
      req.method = 'GET';
    } else {
      req.method = 'GET';
    }
  }
  // Continue to JSON Server router
  next();
};
// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);

server.use(
  jsonServer.rewriter({
    '/smds-service/*': '/$1',
    '/user-manager-service/*': '/$1',
    '/station-definition-service/station-definition/station-groups/query/names':
      '/station-groups-names',
    '/station-definition-service/station-definition/stations/query/names': '/stations-names-time',
    '/station-definition-service/station-definition/stations/query/change-times':
      '/stations-change-times'
  })
);

server.use(proxyRedirection);

// Use default router
server.use(router);
export const listeningJsonServer = server.listen(Number(port), () => {
  // eslint-disable-next-line no-console
  console.log(`JSON Server is running on port ${port} with mock file ${mockFile}.`);
});
