import { WorkflowTypes } from '@gms/common-model';
import React from 'react';

import { AzimuthSlowness } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/azimuth-slowness-component';
import { AzimuthSlownessProps } from '../../../../../src/ts/components/analyst-ui/components/azimuth-slowness/types';
import { signalDetectionsData } from '../../../../__data__/signal-detections-data';
import {
  eventId,
  reactQueryResult,
  signalDetectionsIds,
  timeInterval
} from '../../../../__data__/test-util';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const processingAnalystConfigurationQuery = reactQueryResult;
processingAnalystConfigurationQuery.data = {
  defaultNetwork: 'demo',
  defaultInteractiveAnalysisStationGroup: 'ALL_1',
  defaultFilters: []
};
const azSlowReduxProps: Partial<AzimuthSlownessProps> = {
  location: undefined,
  defaultStationsQuery: {
    defaultProcessingStations: [],
    error: undefined,
    loading: false,
    networkStatus: undefined,
    fetchMore: undefined,
    refetch: undefined,
    startPolling: undefined,
    stopPolling: undefined,
    subscribeToMore: () => () => {
      /**/
    },
    updateQuery: undefined,
    variables: undefined
  },
  processingAnalystConfigurationQuery,
  signalDetectionsByStationQuery: {
    signalDetectionsByStation: signalDetectionsData,
    error: undefined,
    loading: false,
    networkStatus: undefined,
    fetchMore: undefined,
    refetch: undefined,
    startPolling: undefined,
    stopPolling: undefined,
    subscribeToMore: () => () => {
      /**/
    },
    updateQuery: undefined,
    variables: undefined
  },
  eventsInTimeRangeQuery: {
    eventsInTimeRange: [],
    error: undefined,
    loading: false,
    networkStatus: undefined,
    fetchMore: undefined,
    refetch: undefined,
    startPolling: undefined,
    stopPolling: undefined,
    subscribeToMore: () => () => {
      /**/
    },
    updateQuery: undefined,
    variables: undefined
  },
  currentTimeInterval: timeInterval,
  selectedSdIds: signalDetectionsIds,
  openEventId: eventId,
  sdIdsToShowFk: [],
  analysisMode: WorkflowTypes.AnalysisMode.EVENT_REVIEW,
  client: undefined,
  computeFkFrequencyThumbnails: undefined,
  setSelectedSdIds: () => {
    /* no-op */
  },
  computeFks: undefined,
  setWindowLead: undefined,
  setSdIdsToShowFk: () => {
    /* no-op */
  },
  markFksReviewed: undefined
};

describe('AzimuthSlowness Direct', () => {
  test('AzimuthSlowness renders directly with data correctly', () => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const wrapper = Enzyme.shallow(<AzimuthSlowness {...(azSlowReduxProps as any)} />);
    expect(wrapper).toMatchSnapshot();
  });
});
