import { isWindowDefined } from '@gms/common-util';
import { ApolloLink, split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { OperationDefinitionNode } from 'graphql';

// we can't initialize the websocket client if we aren't running in the browser or a renderer process.
// this shouldn't run in the main electron process.
const windowIsDefined = isWindowDefined();

// eslint-disable-next-line
export const SplitLink = (wsLink: WebSocketLink, httpLink: any): ApolloLink =>
  split(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ query }: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node: any = getMainDefinition(query);
      if ((node.kind as string) === 'OperationDefinition') {
        const defNode: OperationDefinitionNode = node;
        return (defNode.operation as string) === 'subscription';
      }
      return false;
    },
    windowIsDefined && wsLink ? wsLink : httpLink,
    httpLink
  );
