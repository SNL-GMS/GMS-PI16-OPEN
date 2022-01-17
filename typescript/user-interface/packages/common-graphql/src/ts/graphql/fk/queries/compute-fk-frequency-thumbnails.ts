import gql from 'graphql-tag';

import { fkFrequencyThumbnailBySDIdFragment } from '../gqls';

export const computeFkFrequencyThumbnailQuery = gql`
  query computeFkFrequencyThumbnails($fkInput: FkInput!) {
    computeFkFrequencyThumbnails(fkInput: $fkInput) {
      ...FkFrequencyThumbnailBySDIdFragment
    }
  }
  ${fkFrequencyThumbnailBySDIdFragment}
`;
