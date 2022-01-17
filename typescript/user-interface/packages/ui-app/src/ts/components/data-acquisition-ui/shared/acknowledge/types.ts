import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';
import { MutationFunction } from 'react-apollo';

import { SohConfigurationQueryProps } from '~components/data-acquisition-ui/client-interface/axios/types';

export interface AcknowledgeWrapperReduxProps {
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
}

export interface AcknowledgeWrapperMutations {
  acknowledgeSohStatus: MutationFunction;
}

export type AcknowledgeWrapperProps = SohConfigurationQueryProps &
  AcknowledgeWrapperReduxProps &
  AcknowledgeWrapperMutations;

/**
 * The function signature that the WithAcknowledge component
 * passes to its child
 */
export interface WithAcknowledgeProps {
  acknowledgeStationsByName(stationNames: string[], comment?: string): void;
}

export interface AcknowledgeOverlayProps extends WithAcknowledgeProps {
  isOpen: boolean;
  stationNames: string[];
  requiresModificationForSubmit?: boolean;
  onClose(): void;
}
