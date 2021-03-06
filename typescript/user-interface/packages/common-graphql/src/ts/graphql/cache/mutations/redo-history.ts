import gql from 'graphql-tag';

import { dataPayloadFragment } from '../gqls';

/**
 * The redo history mutation
 */
export const redoHistoryMutation = gql`
  mutation redoHistory($numberOfItems: Float!) {
    redoHistory(numberOfItems: $numberOfItems) {
      ...DataPayloadFragment
    }
  }
  ${dataPayloadFragment}
`;
