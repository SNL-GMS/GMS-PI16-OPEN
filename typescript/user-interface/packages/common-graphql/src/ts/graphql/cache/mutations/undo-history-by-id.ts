import gql from 'graphql-tag';

import { dataPayloadFragment } from '../gqls';

/**
 * The undo history mutation by id
 */
export const undoHistoryByIdMutation = gql`
  mutation undoHistoryById($id: String!) {
    undoHistoryById(id: $id) {
      ...DataPayloadFragment
    }
  }
  ${dataPayloadFragment}
`;
