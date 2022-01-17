import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';

import { WithAcknowledgeProps } from '../shared/acknowledge';

export interface CommandRegistrarBaseProps {
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  setSelectedStationIds(ids: string[]): void;
}

export type CommandRegistrarProps = CommandRegistrarBaseProps & WithAcknowledgeProps;
