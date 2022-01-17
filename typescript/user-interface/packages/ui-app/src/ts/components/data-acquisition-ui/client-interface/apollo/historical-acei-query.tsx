/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { SohQueries } from '@gms/common-graphql';
import { SohTypes } from '@gms/common-model';
import { ApolloError } from 'apollo-client';
import React from 'react';
import { Query } from 'react-apollo';

/** The historical acei query props */
export interface HistoricalAceiQueryProps {
  stationName: string;
  startTimeMs: number;
  endTimeMs: number;
  type: SohTypes.AceiType;
}

/** The historical acei query data */
export interface HistoricalAceiQueryData {
  loading: boolean;
  error: ApolloError;
  data: SohTypes.UiHistoricalAcei[];
}

/** The historical acei query context - provides the historical acei query data to its consumers */
export const HistoricalAceiQueryContext: React.Context<HistoricalAceiQueryData> = React.createContext<
  HistoricalAceiQueryData
>(undefined);

/**
 * The historical acei query component
 *
 * @param props the props
 */
export const HistoricalAceiQuery: React.FunctionComponent<HistoricalAceiQueryProps> = props => (
  <>
    <Query<
      { historicalAceiByStation: SohTypes.UiHistoricalAcei[] },
      { queryInput: SohTypes.UiHistoricalAceiInput }
    >
      query={SohQueries.historicalAceiByStationQuery}
      variables={{
        queryInput: {
          stationName: props.stationName,
          startTime: props.startTimeMs,
          endTime: props.endTimeMs,
          type: props.type
        }
      }}
      fetchPolicy="no-cache"
      // skip executing the query if any of these conditions are met
      skip={
        props.stationName === undefined ||
        props.startTimeMs === undefined ||
        props.endTimeMs === undefined ||
        props.type === undefined
      }
    >
      {({ loading, error, data }) => (
        <>
          <HistoricalAceiQueryContext.Provider
            // update and provide the historical data to the consumers
            value={{
              loading,
              error,
              data: data?.historicalAceiByStation
            }}
          >
            {props.children}
          </HistoricalAceiQueryContext.Provider>
        </>
      )}
    </Query>
  </>
);
