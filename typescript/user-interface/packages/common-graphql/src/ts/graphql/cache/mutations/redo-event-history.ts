import gql from 'graphql-tag';

import { dataPayloadFragment } from '../gqls';

/**
 * The redo event history mutation
 */
export const redoEventHistoryMutation = gql`
  mutation redoEventHistory($numberOfItems: Float!) {
    redoEventHistory(numberOfItems: $numberOfItems) {
      ...DataPayloadFragment
    }
  }
  ${dataPayloadFragment}
`;
