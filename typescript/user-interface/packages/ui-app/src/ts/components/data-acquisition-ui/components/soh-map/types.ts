import { GQLTypes } from '@gms/common-graphql';
import { ProcessingStationTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { DataAcquisitionWorkspaceTypes } from '@gms/ui-state';

/**
 * SOH lag redux props
 */
interface SohMapReduxProps {
  glContainer?: GoldenLayout.Container;
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  setSelectedStationIds(ids: string[]): void;
}

/**
 * SohMap props
 */
export type SohMapProps = SohMapReduxProps &
  GQLTypes.DefaultStationsQueryProps &
  GQLTypes.UIConfigurationQueryProps;

/**
 * SOH map panel props
 */
export interface SohMapPanelProps {
  minHeightPx: number;
  selectedStationIds: string[];
  sohStatus: DataAcquisitionWorkspaceTypes.SohStatus;
  stations: ProcessingStationTypes.ProcessingStation[];
  setSelectedStationIds(ids: string[]): void;
}
