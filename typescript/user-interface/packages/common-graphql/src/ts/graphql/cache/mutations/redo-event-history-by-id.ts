import gql from 'graphql-tag';

import { dataPayloadFragment } from '../gqls';

/**
 * The redo event history mutation by id
 */
export const redoEventHistoryByIdMutation = gql`
  mutation redoEventHistoryById($id: String!) {
    redoEventHistoryById(id: $id) {
      ...DataPayloadFragment
    }
  }
  ${dataPayloadFragment}
`;
