import { SohTypes } from '@gms/common-model';
import { compose, ValueType } from '@gms/common-util';
import { WithNonIdealStates } from '@gms/ui-core-components';
import { AppState } from '@gms/ui-state';
import * as ReactRedux from 'react-redux';

import { CommonNonIdealStateDefs } from '~components/common-ui/components/non-ideal-states';
import { Queries } from '~components/data-acquisition-ui/client-interface/axios';
import { messageConfig } from '~components/data-acquisition-ui/config/message-config';
import { DataAcquisitionNonIdealStateDefs } from '~components/data-acquisition-ui/shared/non-ideal-states';

import { SohReduxProps } from '../../shared/types';
import {
  buildHistoricalTrendsHistoryComponent,
  HistoricalTrendsHistoryComponentProps
} from '../historical-trends';

/**
 * Create a timeliness history component using the shared history component
 */
const TimelinessHistoryComponent = buildHistoricalTrendsHistoryComponent(
  SohTypes.SohMonitorType.TIMELINESS,
  ValueType.INTEGER,
  messageConfig.labels.timelinessTrendsSubtitle
);

/**
 * Mapping redux state to the properties of the component
 *
 * @param state App state, root level redux store
 */
const mapStateToProps = (state: AppState): Partial<SohReduxProps> => ({
  selectedStationIds: state.commonWorkspaceState.selectedStationIds,
  sohStatus: state.dataAcquisitionWorkspaceState.data.sohStatus
});

/**
 * Renders the Timeliness History display, or a non-ideal state from the provided list of
 * non ideal state definitions
 */
const TimelinessHistoryComponentOrNonIdealState = WithNonIdealStates<
  HistoricalTrendsHistoryComponentProps
>(
  [
    ...CommonNonIdealStateDefs.baseNonIdealStateDefinitions,
    ...DataAcquisitionNonIdealStateDefs.generalSohNonIdealStateDefinitions,
    ...DataAcquisitionNonIdealStateDefs.stationSelectedSohNonIdealStateDefinitions
  ],
  TimelinessHistoryComponent
);

/**
 * A new apollo component that's wrapping the SohTimelinessHistory component and injecting
 * apollo graphQL queries and mutations.
 */
export const ApolloSohTimelinessHistoryContainer = compose(
  ReactRedux.connect(mapStateToProps),
  Queries.SohConfigurationQuery.withSohConfigurationQuery<HistoricalTrendsHistoryComponentProps>()
)(TimelinessHistoryComponentOrNonIdealState);
