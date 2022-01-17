import { nonIdealStateWithNoSpinner, nonIdealStateWithSpinner } from '@gms/ui-core-components';

export const nonIdealStateSelectAStation = nonIdealStateWithNoSpinner(
  'No station selected',
  'Select a station in the Waveform or Map Display to view station properties',
  'select'
);
export const nonIdealStateLoadingEffectiveAtsQuery = nonIdealStateWithSpinner(
  'Loading effective at times',
  'One moment, data is being loaded'
);
export const nonIdealStateLoadingStationDataQuery = nonIdealStateWithSpinner(
  'Loading station data',
  'One moment, data is being loaded'
);
export const nonIdealStateNoDataForStationsSelected = nonIdealStateWithNoSpinner(
  'No data for selected station',
  'There appears to be no data for station',
  'exclude-row'
);
export const nonIdealStateTooManyStationsSelected = nonIdealStateWithNoSpinner(
  'Multiple stations selected',
  'Select a single station to view station properties',
  'exclude-row'
);
export const nonIdealStateNoOperationalTimePeriod = nonIdealStateWithNoSpinner(
  'No operational time period',
  'Operational time period has not loaded',
  'exclude-row'
);
export const nonIdealStateSelectChannelGroupRow = nonIdealStateWithNoSpinner(
  'Select a channel group',
  'To populate channel data',
  'select'
);
export const nonIdealStateEmptyEffectiveAtsQuery = nonIdealStateWithNoSpinner(
  'Missing effective at times',
  'No effective at times found for Station',
  'exclude-row'
);
