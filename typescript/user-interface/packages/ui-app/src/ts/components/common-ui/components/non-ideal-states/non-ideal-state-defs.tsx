import GoldenLayout from '@gms/golden-layout';
import { NonIdealStateDefinition, nonIdealStateWithNoSpinner } from '@gms/ui-core-components';

export const baseNonIdealStateDefinitions: NonIdealStateDefinition<{
  glContainer?: GoldenLayout.Container;
}>[] = [
  {
    condition: props => props.glContainer && props.glContainer.isHidden,
    element: nonIdealStateWithNoSpinner()
  }
];
