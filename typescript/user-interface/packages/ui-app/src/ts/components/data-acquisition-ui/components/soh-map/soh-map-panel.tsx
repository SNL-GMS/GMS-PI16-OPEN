/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/prop-types */
import { Drawer, H5, Position, Radio } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { CheckboxListEntry, SimpleCheckboxList } from '@gms/ui-core-components';
import { useImmutableMap } from '@gms/ui-util';
import * as Cesium from 'cesium';
import * as React from 'react';
import { Entity } from 'resium';

import { Map } from '~components/common-ui/components/map';
import { useShowLegend } from '~components/data-acquisition-ui/shared/show-legend-hook';
import { BaseToolbar } from '~components/data-acquisition-ui/shared/toolbars/base-toolbar';

import { mapStationsToSohEntities } from './station-data-source';
import { SohMapPanelProps } from './types';

/** defines the width in pixels for the toolbar */
const widthPx = 240;

/** defines the width in pixels for the drawer size */
const drawerSizePx = 240;

/** defines the station layer label */
const stationLayer = 'Stations';

/** defines the available layer options displayed in the drawer */
const layerOptions = [stationLayer];

/**
 * SOH map panel component
 *
 * @param props the props
 */
export const SohMapPanel: React.FunctionComponent<SohMapPanelProps> = props => {
  const stationSoh = props.sohStatus?.stationAndStationGroupSoh;
  const stationGroups = stationSoh?.stationGroups;
  const stationGroupNames = stationGroups?.map(entry => entry.stationGroupName);

  const [layersLegend, isLayersLegendVisible, setLayersShowLegend] = useShowLegend(
    'Shows options for map'
  );
  const [layerVisibilityMap, setLayerVisibilityMap] = useImmutableMap<boolean>(layerOptions, true);
  const [stationGroupVisibilityMap, setStationVisibilityMap] = useImmutableMap<boolean>(
    stationGroupNames,
    true
  );
  const [showSohStatus, setShowSohStatus] = React.useState(true);

  // checklist of station group names
  const stationGroupSelectionEntries = stationGroupNames?.map(name => {
    const checkboxListEntry: CheckboxListEntry = {
      name,
      isChecked: stationGroupVisibilityMap.get(name)
    };
    return checkboxListEntry;
  });

  // popover content for the station icon button
  const content = (
    <div className="icon-cell-content__container">
      <div id="left" className="icon-cell-content__left">
        <div>
          <H5 className="icon-cell-content__left--header">Filter by Station Group</H5>
        </div>
        <div className="icon-cell-content__left--checkbox-list">
          <SimpleCheckboxList
            checkBoxListEntries={stationGroupSelectionEntries}
            onChange={item =>
              setStationVisibilityMap(
                stationGroupVisibilityMap.set(item, !stationGroupVisibilityMap.get(item))
              )
            }
          />
        </div>
      </div>
      <div id="right" className="icon-cell-content__right">
        <H5 className="icon-cell-content__right--header">Station Color</H5>
        <div className="icon-cell-content__right--radio-list">
          <Radio
            label="Soh Status"
            value="sohStatus"
            key="sohStatus"
            className="alignment-dropdown__radio"
            checked={showSohStatus}
            onChange={() => setShowSohStatus(!showSohStatus)}
          />
          <Radio
            label="Capability Status"
            value="capabilityStatus"
            key="capabilityStatus"
            className="alignment-dropdown__radio"
            checked={!showSohStatus}
            onChange={() => setShowSohStatus(!showSohStatus)}
          />
        </div>
      </div>
    </div>
  );

  // layer selection entries
  const layerSelectionEntries: CheckboxListEntry[] = [
    {
      name: stationLayer,
      isChecked: layerVisibilityMap.get(stationLayer),
      iconButton: {
        iconName: IconNames.COG,
        popover: {
          content,
          position: Position.RIGHT_BOTTOM,
          usePortal: true,
          minimal: true
        }
      }
    }
  ];

  // filter out stations based on the selected groups
  const filteredStationSoh = props.sohStatus.stationAndStationGroupSoh.stationSoh.filter(s =>
    s.stationGroups
      .map(g => g.groupName)
      .find(n => stationGroupVisibilityMap.has(n) && stationGroupVisibilityMap.get(n))
  );
  // map stations to cesium entities
  const entities = mapStationsToSohEntities(
    props.stations,
    filteredStationSoh,
    props.selectedStationIds,
    showSohStatus
  );
  const onClickHandler = (targetEntity: Cesium.Entity) => () => {
    props.setSelectedStationIds([targetEntity.id]);
  };
  // map cesium entities to resium components
  const entityComponents = entities.map((sohEntity: Cesium.Entity) => {
    return (
      <Entity
        id={sohEntity.id}
        label={sohEntity.label}
        key={sohEntity.id}
        name={sohEntity.name}
        billboard={sohEntity.billboard}
        show={sohEntity.show}
        properties={sohEntity.properties}
        position={sohEntity.position.getValue(Cesium.JulianDate.now())}
        onClick={onClickHandler(sohEntity)}
      />
    );
  });
  return (
    <div>
      <div className="soh-map-toolbar">
        <BaseToolbar widthPx={widthPx} itemsLeft={[layersLegend]} items={[]} />
      </div>
      <div className="soh-map-wrapper">
        <Map
          minHeightPx={props.minHeightPx}
          entities={layerVisibilityMap.get(stationLayer) ? entityComponents : []}
        />
        <Drawer
          className="soh-legend"
          title="Stations"
          isOpen={isLayersLegendVisible}
          autoFocus
          canEscapeKeyClose
          canOutsideClickClose
          enforceFocus={false}
          hasBackdrop={false}
          position={Position.LEFT}
          size={drawerSizePx}
          onClose={() => setLayersShowLegend(!isLayersLegendVisible)}
          usePortal={false}
        >
          <SimpleCheckboxList
            checkBoxListEntries={layerSelectionEntries}
            onChange={layer =>
              setLayerVisibilityMap(layerVisibilityMap.set(layer, !layerVisibilityMap.get(layer)))
            }
          />
        </Drawer>
      </div>
    </div>
  );
};
