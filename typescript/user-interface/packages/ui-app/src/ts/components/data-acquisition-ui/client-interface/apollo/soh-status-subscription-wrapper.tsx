/* eslint-disable react/destructuring-assignment */
import { SohQueries, SohSubscriptions } from '@gms/common-graphql';
import { SohTypes } from '@gms/common-model';
import { compose, MILLISECONDS_IN_SECOND, setDecimalPrecision, toOSDTime } from '@gms/common-util';
import { UILogger } from '@gms/ui-apollo';
import {
  AppState,
  DataAcquisitionWorkspaceActions,
  DataAcquisitionWorkspaceTypes
} from '@gms/ui-state';
import ApolloClient, { ApolloError } from 'apollo-client';
import delay from 'lodash/delay';
import unionBy from 'lodash/unionBy';
import React from 'react';
import {
  OnSubscriptionDataOptions,
  useApolloClient,
  useQuery,
  useSubscription
} from 'react-apollo';
import * as ReactRedux from 'react-redux';
import * as Redux from 'redux';

import { withSohConfigurationQuery } from '~components/data-acquisition-ui/client-interface/axios/queries/soh-configuration-query';
import {
  getLatestSohTime,
  isSohStationStaleTimeMS
} from '~components/data-acquisition-ui/shared/table/utils';

import { SohConfigurationQueryProps } from '../axios/types';

interface ReduxProps {
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  setSohStatus(sohStatus: DataAcquisitionWorkspaceTypes.SohStatus): void;
}

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<ReduxProps> => ({
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus
});

/**
 * Mapping methods (actions and operations) to dispatch one or more updates to the redux store
 *
 * @param dispatch the redux dispatch event alerting the store has changed
 */
const mapDispatchToProps = (dispatch): Partial<ReduxProps> =>
  Redux.bindActionCreators(
    {
      setSohStatus: DataAcquisitionWorkspaceActions.setSohStatus
    },
    dispatch
  );

export type Props = ReduxProps & SohConfigurationQueryProps;

/**
 * Wrap the provided component with the SOH Status Subscription.
 *
 * @param Component the component to wrap
 * @param store the redux store
 */
export const wrapSohStatusSubscriptions = (
  // eslint-disable-next-line
  Component: any,
  // eslint-disable-next-line
  props: any,
  store: Redux.Store<AppState>
): ReactRedux.ConnectedComponent<
  React.ComponentType<never>,
  Pick<never, string | number | symbol>
> =>
  compose(
    // connect the redux props
    ReactRedux.connect(mapStateToProps, mapDispatchToProps),
    withSohConfigurationQuery<unknown>()
  )(
    class<T extends Props> extends React.Component<T> {
      // timer id for updating stale data
      private staleTimerId: number | undefined;

      public componentWillUnmount(): void {
        // clean up timer on unmount
        this.cancelStaleTimer();
      }

      // eslint-disable-next-line react/sort-comp
      public render() {
        return (
          <>
            <this.SohQueryAndSubscription />
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <Component store={store} {...props} />
          </>
        );
      }

      /**
       * Set stale timer.
       */
      private setStaleTimer(): void {
        this.cancelStaleTimer();
        this.staleTimerId = delay(
          () =>
            this.props.setSohStatus({
              ...this.props.sohStatus,
              isStale: true
            }),
          this.props.sohConfigurationQuery.data.sohStationStaleMs
        );
      }

      /**
       * Cancel stale timer.
       */
      private cancelStaleTimer(): void {
        clearTimeout(this.staleTimerId);
        this.staleTimerId = undefined;
      }

      /**
       * Query for the Channel SOH Station data
       */
      // eslint-disable-next-line react/sort-comp
      public readonly queryChannelSohForStationQuery = async (
        client: ApolloClient<unknown>
      ): Promise<SohTypes.ChannelSohForStation> => {
        const channelSohForStationQuery =
          this.props.selectedStationIds && this.props.selectedStationIds.length === 1
            ? await client.query<{ channelSohForStation: SohTypes.ChannelSohForStation }>({
                query: SohQueries.channelSohForStationQuery,
                variables: { stationName: this.props.selectedStationIds[0] },
                fetchPolicy: 'no-cache'
              })
            : undefined;
        return channelSohForStationQuery
          ? channelSohForStationQuery.data.channelSohForStation
          : undefined;
      };

      /**
       * Updates the Redux store for the SOH Status
       *
       * @param loading the loading status of the query for the SOH Station data
       * @param error any error status on the query
       * @param stationAndStationGroupSoh the station and station group SOH data - does not include the channel data
       * @param channelSohForStation the channel SOH data for a given station
       * @param callback the callback to be executed after updating the store
       */
      public readonly updateReduxStore = (
        loading: boolean,
        error: ApolloError,
        stationAndStationGroupSoh: SohTypes.StationAndStationGroupSoh,

        channelSohForStation: SohTypes.ChannelSohForStation = undefined,
        callback: () => void = undefined
      ) => {
        // update the redux store
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        new Promise<void>(resolve => {
          // merge station soh data
          const mergedStationAndStationGroupSoh: SohTypes.StationAndStationGroupSoh = {
            stationGroups: unionBy(
              stationAndStationGroupSoh.stationGroups,
              this.props.sohStatus.stationAndStationGroupSoh.stationGroups,
              'id'
            ),
            stationSoh: unionBy(
              stationAndStationGroupSoh.stationSoh,
              this.props.sohStatus.stationAndStationGroupSoh.stationSoh,
              'id'
            ),
            isUpdateResponse: stationAndStationGroupSoh.isUpdateResponse
          };

          // update the channel data for the station
          if (
            channelSohForStation &&
            channelSohForStation.stationName &&
            channelSohForStation.channelSohs
          ) {
            // sort the channel soh data
            channelSohForStation.channelSohs.sort(
              (a: SohTypes.ChannelSoh, b: SohTypes.ChannelSoh) =>
                a.channelName.localeCompare(b.channelName)
            );

            mergedStationAndStationGroupSoh.stationSoh.find(
              s => s.stationName === channelSohForStation.stationName
            ).channelSohs = channelSohForStation.channelSohs;
          }

          // sort the station soh data by name
          mergedStationAndStationGroupSoh.stationSoh.sort(
            (a: SohTypes.UiStationSoh, b: SohTypes.UiStationSoh) =>
              a.stationName.localeCompare(b.stationName)
          );

          const lastUpdated = getLatestSohTime(mergedStationAndStationGroupSoh.stationSoh);
          const isStale = isSohStationStaleTimeMS(
            lastUpdated,
            this.props.sohConfigurationQuery.data?.sohStationStaleMs
          );

          this.props.setSohStatus({
            lastUpdated,
            isStale,
            loading,
            error,
            stationAndStationGroupSoh: mergedStationAndStationGroupSoh
          });
          resolve();
        })
          .then(
            callback ||
              (() => {
                /* no-op */
              })
          )
          .catch(e =>
            UILogger.Instance().error(`Failed to update Redux state for SOH Status ${e}`)
          );
      };

      /**
       * The SOH Query and Subscription component
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      public readonly SohQueryAndSubscription: React.FunctionComponent<any> = p => {
        // !FIX ESLINT REACT HOOK HOOKS MUST BE IN FUNCTIONAL COMPONENT
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const client = useApolloClient();

        // !FIX ESLINT REACT HOOK HOOKS MUST BE IN FUNCTIONAL COMPONENT
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useEffect(() => {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.queryChannelSohForStationQuery(client)
            .then(channelSohForStation => {
              this.updateReduxStore(
                this.props.sohStatus.loading,
                this.props.sohStatus.error,
                this.props.sohStatus.stationAndStationGroupSoh,
                channelSohForStation
              );
            })
            .catch(error =>
              UILogger.Instance().error(`Failed to queryChannelSohForStationQuery ${error}`)
            );
          // !FIX ESLINT Validate and check REACT HOOK dependencies
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [this.props.selectedStationIds]);

        // setup the query for station and station group data
        // !FIX ESLINT REACT HOOK HOOKS MUST BE IN FUNCTIONAL COMPONENT
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const StationAndStationGroupSohQuery = useQuery<{
          stationAndStationGroupSoh: SohTypes.StationAndStationGroupSoh;
        }>(SohQueries.sohStationAndGroupStatusQuery, {
          client,
          fetchPolicy: 'no-cache',
          onCompleted: data => {
            // update the redux store from the station query
            this.updateReduxStore(
              StationAndStationGroupSohQuery.loading,
              StationAndStationGroupSohQuery.error,
              data.stationAndStationGroupSoh
            );
          }
        });

        // set up the subscriptions for SOH data
        // !FIX ESLINT REACT HOOK HOOKS MUST BE IN FUNCTIONAL COMPONENT
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useSubscription<{ sohStatus: SohTypes.StationAndStationGroupSoh }>(
          SohSubscriptions.sohStatusSubscription,
          {
            client,
            fetchPolicy: 'no-cache',
            onSubscriptionData: async (
              options: OnSubscriptionDataOptions<{
                sohStatus: SohTypes.StationAndStationGroupSoh;
              }>
            ) => {
              // query the channel SOH data for the selected station
              const channelSohForStation = await this.queryChannelSohForStationQuery(client);

              // update the redux store
              this.updateReduxStore(
                StationAndStationGroupSohQuery.loading,
                StationAndStationGroupSohQuery.error,
                options.subscriptionData.data.sohStatus,
                channelSohForStation,
                async () => {
                  const promise = new Promise<void>(resolve => {
                    const now = Date.now();

                    // log timing point messages
                    const updatedStationSoh = [
                      ...options.subscriptionData.data.sohStatus.stationSoh
                    ];

                    // Do not log timing point C for any Ack/Quiet responses
                    const { isUpdateResponse } = options.subscriptionData.data.sohStatus;
                    if (!isUpdateResponse) {
                      const timingPointMessages = updatedStationSoh.map(
                        stationSoh =>
                          `Timing point C: SOH object ${
                            stationSoh.uuid
                          } displayed in UI at ${toOSDTime(
                            now / MILLISECONDS_IN_SECOND
                          )} A->C ${setDecimalPrecision(
                            now / MILLISECONDS_IN_SECOND - stationSoh.time,
                            3
                          )} seconds`
                      );

                      // Call reporting timing points mutation to record in the UI Backend log
                      UILogger.Instance().timing(...timingPointMessages);
                    }

                    this.setStaleTimer();

                    resolve();
                  });
                  await promise;
                }
              );
            }
          }
        );

        return <>{...p.children}</>;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  );
