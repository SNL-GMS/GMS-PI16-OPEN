import {
  NonIdealStateDefinition,
  nonIdealStateWithNoSpinner,
  nonIdealStateWithSpinner
} from '@gms/ui-core-components';

import { WaveformDisplayReduxProps } from '~analyst-ui/components/waveform/types';
import { QueryAndMutationTypes } from '~components/client-interface';

/**
 * Non ideal state definitions for processingAnalystConfiguration query
 */
export const processingAnalystConfigNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (
      props: unknown & QueryAndMutationTypes.ProcessingAnalystConfigurationQueryProps
    ): boolean => {
      return props.processingAnalystConfigurationQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Default Configuration')
  },
  {
    condition: (
      props: unknown & QueryAndMutationTypes.ProcessingAnalystConfigurationQueryProps
    ): boolean => {
      return props.processingAnalystConfigurationQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Problem Loading Default Configuration')
  }
];

/**
 * Non ideal state definitions for operationalTimePeriodConfiguration query
 */
export const operationalTimePeriodConfigNonIdealStateDefinitions: NonIdealStateDefinition<
  unknown
>[] = [
  {
    condition: (
      props: unknown & QueryAndMutationTypes.OperationalTimePeriodConfigurationQueryProps
    ): boolean => {
      return props.operationalTimePeriodConfigurationQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Operational Time Period Configuration')
  },
  {
    condition: (
      props: unknown & QueryAndMutationTypes.OperationalTimePeriodConfigurationQueryProps
    ): boolean => {
      return props.operationalTimePeriodConfigurationQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Operational Time Period Configuration')
  }
];

/**
 * Non ideal state definitions for events query
 */
export const eventNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & QueryAndMutationTypes.EventQueryProps): boolean => {
      return props.eventQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Events')
  },
  {
    condition: (props: unknown & QueryAndMutationTypes.EventQueryProps): boolean => {
      return props.eventQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Problem Loading Events')
  }
];

/**
 * Non ideal state definitions for signalDetection query
 */
export const signalDetectionsNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & QueryAndMutationTypes.SignalDetectionsQueryProps): boolean => {
      return props.signalDetectionQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Signal Detections')
  },
  {
    condition: (props: unknown & QueryAndMutationTypes.SignalDetectionsQueryProps): boolean => {
      return props.signalDetectionQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Problem Loading Signal Detections')
  }
];

/**
 * Non ideal state definitions for qcMask query
 */
export const qcMaskNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & QueryAndMutationTypes.QCMaskQueryProps): boolean => {
      return props.qcMaskQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'QC Masks')
  },
  {
    condition: (props: unknown & QueryAndMutationTypes.QCMaskQueryProps): boolean => {
      return props.qcMaskQuery?.isError;
    },
    element: nonIdealStateWithSpinner('Error', 'Loading QC Masks')
  }
];

/**
 * Non ideal state definitions for qcMask query
 */
export const stationDefinitionNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & QueryAndMutationTypes.StationDefinitionQueryProps): boolean => {
      return props.stationDefinitionsQuery?.isLoading;
    },
    element: nonIdealStateWithSpinner('Loading', 'Station Definitions')
  },
  {
    condition: (props: unknown & QueryAndMutationTypes.StationDefinitionQueryProps): boolean => {
      return props.stationDefinitionsQuery?.isError;
    },
    element: nonIdealStateWithNoSpinner('Error', 'Loading Station Definitions')
  }
];

/**
 * Non ideal state definitions for current interval query
 */
export const currentIntervalNonIdealStateDefinitions: NonIdealStateDefinition<unknown>[] = [
  {
    condition: (props: unknown & WaveformDisplayReduxProps): boolean => {
      return (
        !props.currentTimeInterval ||
        !props.currentTimeInterval.endTimeSecs ||
        !props.currentTimeInterval.startTimeSecs
      );
    },
    element: nonIdealStateWithNoSpinner(
      'No Interval Selected',
      'Select an interval in the Workflow Display to view waveforms'
    )
  }
];
