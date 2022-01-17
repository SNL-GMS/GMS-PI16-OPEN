import { ChannelTypes, StationTypes } from '@gms/common-model';
import { HorizontalDivider } from '@gms/ui-core-components';
import React, { useCallback, useState } from 'react';

import {
  channelColumnsToDisplay,
  siteColumnsToDisplay
} from '~analyst-ui/components/station-properties/station-properties-utils';
import { useStationsQuery } from '~components/client-interface/axios/queries/stations-definition-query';

import { ChannelConfigurationTable } from './channel-configuration-table';
import { SiteConfigurationTable } from './site-configuration-table';
import {
  nonIdealStateNoDataForStationsSelected,
  nonIdealStateSelectChannelGroupRow
} from './station-properties-non-ideal-states';
import { StationPropertiesToolbar } from './station-properties-toolbar';
import { SiteConfigurationRowClickedEvent, StationPropertiesPanelProps } from './types';

export const getOnEffectiveTimeChange = (
  setLockSelectedEffectiveAt: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedEffectiveAt: React.Dispatch<React.SetStateAction<number>>,
  effectiveAtTimes: string[]
) => {
  return (newEffectiveAt: string): void => {
    setLockSelectedEffectiveAt(true);
    setSelectedEffectiveAt(effectiveAtTimes.indexOf(newEffectiveAt));
  };
};

export const StationPropertiesPanel: React.FunctionComponent<StationPropertiesPanelProps> = ({
  selectedStation,
  effectiveAtTimes
}: StationPropertiesPanelProps) => {
  const [selectedChannelGroup, setSelectedChannelGroup] = useState(null);
  const [lockSelectedEffectiveAt, setLockSelectedEffectiveAt] = useState(false);
  const [selectedEffectiveAt, setSelectedEffectiveAt] = useState(0);
  const [selectedSiteColumnsToDisplay, setSelectedSiteColumnsToDisplay] = useState(
    siteColumnsToDisplay
  );
  const [selectedChannelColumnsToDisplay, setSelectedChannelColumnsToDisplay] = useState(
    channelColumnsToDisplay
  );

  const stationResult = useStationsQuery([selectedStation], effectiveAtTimes[selectedEffectiveAt]);
  // set the effective at time based on selection drop down
  const onEffectiveTimeChange = getOnEffectiveTimeChange(
    setLockSelectedEffectiveAt,
    setSelectedEffectiveAt,
    effectiveAtTimes
  );

  let stationData: StationTypes.Station;

  if (stationResult && stationResult.data)
    stationData = stationResult.data.find(stn => stn.name === selectedStation);

  const chanGroup: ChannelTypes.ChannelGroup = stationData
    ? stationData.channelGroups.find(group => group.name === selectedChannelGroup)
    : undefined;
  // make sure we got a channelGroup
  const channels = chanGroup?.channels;

  const onChannelGroupRowSelection = useCallback((event: SiteConfigurationRowClickedEvent) => {
    setSelectedChannelGroup(event.node.data.name);
  }, []);

  React.useEffect(
    () => {
      if (stationResult.status === 'success' && !stationData && !lockSelectedEffectiveAt) {
        if (selectedEffectiveAt === effectiveAtTimes.length - 1) {
          setLockSelectedEffectiveAt(true);
          setSelectedEffectiveAt(0);
        } else {
          setSelectedEffectiveAt(selectedEffectiveAt + 1);
        }
      } else if (selectedEffectiveAt >= effectiveAtTimes.length) {
        setSelectedEffectiveAt(0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stationResult.status, effectiveAtTimes]
  );
  const getTables = () => {
    if (!stationData) {
      return nonIdealStateNoDataForStationsSelected;
    }
    return (
      <HorizontalDivider
        sizeRange={{
          minimumBottomHeightPx: 200,
          minimumTopHeightPx: 200
        }}
        topHeightPx={250}
        top={
          <SiteConfigurationTable
            station={stationData}
            onRowSelection={onChannelGroupRowSelection}
            columnsToDisplay={selectedSiteColumnsToDisplay}
          />
        }
        bottom={
          selectedChannelGroup ? (
            <ChannelConfigurationTable
              stationData={stationData}
              channels={channels}
              columnsToDisplay={selectedChannelColumnsToDisplay}
            />
          ) : (
            nonIdealStateSelectChannelGroupRow
          )
        }
      />
    );
  };

  return (
    <div className="station-properties-panel">
      <StationPropertiesToolbar
        selectedStation={stationData}
        stationName={selectedStation}
        selectedEffectiveAt={effectiveAtTimes[selectedEffectiveAt]}
        effectiveAtTimes={effectiveAtTimes}
        onEffectiveTimeChange={onEffectiveTimeChange}
        setSelectedSiteColumnsToDisplay={setSelectedSiteColumnsToDisplay}
        setSelectedChannelColumnsToDisplay={setSelectedChannelColumnsToDisplay}
      />
      {getTables()}
    </div>
  );
};
