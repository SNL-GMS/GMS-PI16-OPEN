/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { SohTypes } from '@gms/common-model';
import { ToolbarTypes } from '@gms/ui-core-components';
import * as React from 'react';

import { useBaseDisplaySize } from '~components/common-ui/components/base-display/base-display-hooks';
import { FilterableSOHTypes } from '~components/data-acquisition-ui/components/soh-overview/types';
import { messageConfig } from '~components/data-acquisition-ui/config/message-config';
import { SohToolbar } from '~components/data-acquisition-ui/shared/toolbars/soh-toolbar';

export interface ToolbarProps {
  statusesToDisplay: Map<FilterableSOHTypes, boolean>;
  sortDropdown: ToolbarTypes.DropdownItem;
  forwardRef: React.MutableRefObject<HTMLElement>;
  station: SohTypes.UiStationSoh;
  monitorType: SohTypes.SohMonitorType;
  setStatusesToDisplay: React.Dispatch<React.SetStateAction<Map<FilterableSOHTypes, boolean>>>;
}

export const Toolbar: React.FunctionComponent<ToolbarProps> = props => {
  const [widthPx] = useBaseDisplaySize();

  return (
    <div
      ref={ref => {
        // eslint-disable-next-line no-param-reassign
        props.forwardRef.current = ref;
      }}
      className="soh-drill-down__header"
    >
      <SohToolbar
        setStatusesToDisplay={statuses => {
          props.setStatusesToDisplay(statuses);
        }}
        leftItems={[]}
        rightItems={[props.sortDropdown]}
        statusFilterText={messageConfig.labels.sohToolbar.filterStatuses}
        statusesToDisplay={props.statusesToDisplay}
        widthPx={widthPx}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        toggleHighlight={() => {}}
      />
      <div className="soh-drill-down-station-label display-title">
        {props.station.stationName}
        <div className="display-title__subtitle">
          {/* eslint-disable-next-line no-nested-ternary */}
          {props.monitorType === SohTypes.SohMonitorType.MISSING
            ? messageConfig.labels.missingSubtitle
            : props.monitorType === SohTypes.SohMonitorType.LAG
            ? messageConfig.labels.lagSubtitle
            : messageConfig.labels.timelinessSubtitle}
        </div>
      </div>
    </div>
  );
};
