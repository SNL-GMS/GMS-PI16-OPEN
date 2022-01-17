import gql from 'graphql-tag';

/**
 * Represents gql SOHStationGroupWithPriority fragment.
 */
export const analystConfigurationFragment = gql`
  fragment AnalystConfigurationFragment on AnalystConfiguration {
    logLevel
  }
`;
