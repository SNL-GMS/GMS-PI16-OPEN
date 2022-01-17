/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

import { useBaseDisplaySize } from '~components/common-ui/components/base-display/base-display-hooks';
import { messageConfig } from '~components/data-acquisition-ui/config/message-config';
import { SohToolbar } from '~components/data-acquisition-ui/shared/toolbars/soh-toolbar';
import { gmsLayout } from '~scss-config/layout-preferences';

const PADDING_PX = Number(gmsLayout.displayPaddingPx) * 2;

export interface EnvironmentToolbarProps {
  filterDropdown: ToolbarTypes.CheckboxDropdownItem[];
  monitorStatusesToDisplay: Map<any, boolean>;
  setMonitorStatusesToDisplay(statuses: any): void;
}

export const EnvironmentToolbar: React.FunctionComponent<EnvironmentToolbarProps> = props => {
  const [widthPx] = useBaseDisplaySize();
  return (
    <>
      <SohToolbar
        setStatusesToDisplay={statuses => props.setMonitorStatusesToDisplay(statuses)}
        leftItems={props.filterDropdown}
        rightItems={[]}
        statusFilterText={messageConfig.labels.sohToolbar.filterMonitorsByStatus}
        statusesToDisplay={props.monitorStatusesToDisplay}
        widthPx={widthPx - PADDING_PX * 2}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        toggleHighlight={() => {}}
      />
      {props.children}
    </>
  );
};
