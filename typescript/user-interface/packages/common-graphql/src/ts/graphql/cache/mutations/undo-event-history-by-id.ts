import gql from 'graphql-tag';

import { dataPayloadFragment } from '../gqls';

/**
 * The undo event history mutation by id
 */
export const undoEventHistoryByIdMutation = gql`
  mutation undoEventHistoryById($id: String!) {
    undoEventHistoryById(id: $id) {
      ...DataPayloadFragment
    }
  }
  ${dataPayloadFragment}
`;
