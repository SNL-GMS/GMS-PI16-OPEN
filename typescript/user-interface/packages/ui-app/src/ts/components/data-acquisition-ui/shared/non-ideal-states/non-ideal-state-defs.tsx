import { SohTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import {
  NonIdealStateDefinition,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner
} from '@gms/ui-core-components';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';

import { SohQueryAndMutationTypes } from '~components/data-acquisition-ui/client-interface';

/**
 * Finds the station from the props path and returns it
 *
 * @param props the base component props, which expects the station to live in
 * props.sohStatus.stationAndStationGroupSoh.stationSoh
 */
const getStationFromProps = (props: any): SohTypes.UiStationSoh =>
  props.sohStatus?.stationAndStationGroupSoh?.stationSoh?.find(
    s => s.stationName === props.selectedStationIds[0]
  );

/**
 * Non ideal state definitions
 * Shared by all SOH displays
 */
export const generalSohNonIdealStateDefinitions: NonIdealStateDefinition<
  {
    sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  } & SohQueryAndMutationTypes.SohConfigurationQueryProps & {
      glContainer?: GoldenLayout.Container;
    }
>[] = [
  {
    condition: props => !props.sohStatus,
    element: nonIdealStateWithSpinner('No SOH Data', 'Station SOH')
  },
  {
    condition: props => props.sohStatus && props.sohStatus.loading,
    element: nonIdealStateWithSpinner('Loading:', 'Station SOH')
  },
  {
    condition: props => props.sohStatus.stationAndStationGroupSoh === undefined,
    element: nonIdealStateWithSpinner('No Station Group Data:', 'For SOH')
  },
  {
    condition: props =>
      props.sohStatus.stationAndStationGroupSoh.stationGroups.length === 0 ||
      props.sohStatus.stationAndStationGroupSoh.stationSoh.length === 0,
    element: nonIdealStateWithNoSpinner('No Data:', 'Configure Station Groups')
  },
  {
    condition: props => !props.sohConfigurationQuery,
    element: nonIdealStateWithSpinner('No SOH Configuration')
  },
  {
    condition: props =>
      !props.sohConfigurationQuery || props.sohConfigurationQuery.data === undefined,
    element: nonIdealStateWithSpinner('Loading:', 'Configuration for User!')
  }
];

const stationSelectedCondition = props => {
  return !props.sohStatus.stationAndStationGroupSoh.stationSoh.find(
    s => s.stationName === props.selectedStationIds[0]
  );
};

/**
 * Non ideal state definitions
 * Shared by SOH displays that depend on a station to be selected
 */
export const stationSelectedSohNonIdealStateDefinitions: NonIdealStateDefinition<{
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
}>[] = [
  {
    condition: props => !props.selectedStationIds || props.selectedStationIds.length === 0,
    element: nonIdealStateWithNoSpinner(
      'No Station Selected',
      `Select a station in SOH Overview or Station Statistics`
    )
  },
  {
    condition: props => stationSelectedCondition(props),
    element: nonIdealStateWithSpinner('Loading:', `Station SOH`)
  },
  {
    condition: props => props.selectedStationIds.length > 1,
    element: nonIdealStateWithNoSpinner('Multiple Stations Selected', `Select a single station`)
  }
];

/**
 * Non ideal state definitions
 * Shared by SOH Displays that depend on channel data
 */
export const channelSohNonIdealStateDefinitions: NonIdealStateDefinition<any>[] = [
  {
    condition: (props): boolean => {
      const station = getStationFromProps(props);
      const channelSohs = station ? station.channelSohs : undefined;
      return !channelSohs;
    },
    element: nonIdealStateWithSpinner('Loading', 'Channel SOH')
  },
  {
    condition: (props): boolean => {
      const station = getStationFromProps(props);
      const channelSohs = station ? station.channelSohs : [];
      return channelSohs.length === 0;
    },
    element: nonIdealStateWithNoSpinner('No Channel Data', "Check this station's configuration")
  }
];
