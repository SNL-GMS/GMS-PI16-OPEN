import { SohTypes } from '@gms/common-model';
import msgpack from 'msgpack-lite';

import { ConfigurationProcessor } from '../configuration/configuration-processor';
import { KafkaConsumer } from '../kafka/kafka-consumer';
import { KafkaProducer } from '../kafka/kafka-producer';
import { gatewayLogger as logger } from '../log/gateway-logger';
import { SohProcessor } from '../soh/soh-processor';
import { ProcessingStationProcessor } from '../station/processing-station/processing-station-processor';
import { SystemMessageProcessor } from '../system-message/system-message-processor';
import { schema } from './api-soh-gateway-schema';
import { createApolloExpressServer } from './apollo-server';
import { createExpressServer, getProtocol } from './express-server';
import { ExpressUser, ExpressUserMap } from './express-user';
import { createHttpServer } from './http-server';
import {
  configureRouteAlive,
  configureRouteAuthentication,
  configureRouteCheckApollo,
  configureRouteCheckInitialized,
  configureRouteCheckKafka,
  configureRouteCheckWebsocket,
  configureRouteHealthCheck,
  configureRouteReady
} from './routes';
import { createWebSocketServer } from './websocket-server';

logger.info('Starting API SOH Gateway Server...');

const userMap: ExpressUserMap = new Map<string, ExpressUser>();
const app = createExpressServer();
createHttpServer(app);
configureRouteAlive(app);
configureRouteReady(app, getProtocol());
configureRouteHealthCheck(app, getProtocol());

const initializeProcessors = async () => {
  // Initialize the API Gateway Processors
  logger.info(`==> initialize processors, data, and initial configuration`);

  // ! The initialization order matters
  // Configuration Processor which makes a network call to get the Analyst UI Configuration.
  await ConfigurationProcessor.Instance().fetchConfiguration();
  await ProcessingStationProcessor.Instance().fetchStationData();
  configureRouteCheckInitialized(app);
};

const initializeKafka = async () => {
  // Initialize the KAFKA Consumers and Producers
  logger.info(`==> initialize KAFKA configurations`);

  // Initialize the system message Kafka consumer
  await KafkaConsumer.Instance().start();

  // Initialize the SOH Kafka producer
  await KafkaProducer.Instance().start();

  // register callbacks for kafka
  SohProcessor.Instance().registerKafkaConsumerCallbacks();
  SystemMessageProcessor.Instance().registerKafkaConsumerCallbacks();

  configureRouteCheckKafka(app);
};

const initializeApollo = () => {
  logger.info(`==> initialize Apollo Express server`);
  createApolloExpressServer(app, schema, userMap);
  configureRouteCheckApollo(app, getProtocol());
};

const initializeWebsocketServer = () => {
  logger.info(`==> initialize websocket server`);
  createWebSocketServer(schema, userMap);
  configureRouteCheckWebsocket(app);
};

// sets up and configures any routes for osd services; allowing apollo graphql to be bypassed
const configureAdditionalRoutes = () => {
  const handler = async (req, res) => {
    const data = await SohProcessor.Instance().getHistoricalSohData(
      req.body as SohTypes.UiHistoricalSohInput
    );

    if (req && req.headers) {
      const acceptContentHeader = req.headers.accept;
      // handle content type that should be returned and encoded using message pack
      if (acceptContentHeader !== null && acceptContentHeader.includes('application/msgpack')) {
        res.set('content-type', 'application/msgpack');
        res.send(msgpack.encode(data));
        return;
      }
    }

    res.send(data);
  };

  const sohHistoricalRoute = '/ssam-control/retrieve-decimated-historical-station-soh';
  logger.info(`register ${sohHistoricalRoute}`);
  app.post(sohHistoricalRoute, handler);
};

// eslint-disable-next-line no-void
void initializeProcessors()
  .then(initializeKafka)
  .then(initializeApollo)
  .then(initializeWebsocketServer)
  .then(() => {
    configureRouteAuthentication(app, userMap);
    configureAdditionalRoutes();
  })
  .catch(e => logger.error(e));
