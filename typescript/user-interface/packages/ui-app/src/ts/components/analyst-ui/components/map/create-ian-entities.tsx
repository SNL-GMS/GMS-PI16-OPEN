import { ChannelTypes, StationTypes } from '@gms/common-model';
import { CommonWorkspaceTypes } from '@gms/ui-state';
import {
  BillboardGraphics,
  Cartesian3,
  Color,
  ColorMaterialProperty,
  ConstantPositionProperty,
  ConstantProperty,
  DistanceDisplayCondition,
  Entity,
  HorizontalOrigin,
  LabelGraphics,
  LabelStyle,
  PolylineGraphics,
  VerticalOrigin
} from 'cesium';
import Immutable from 'immutable';
import uniqWith from 'lodash/uniqWith';

import {
  BILLBOARD_HEIGHT_SELECTED,
  BILLBOARD_HEIGHT_UNSELECTED_CHANNEL,
  BILLBOARD_HEIGHT_UNSELECTED_STATION,
  LABEL_HEIGHT_SELECTED,
  LABEL_HEIGHT_UNSELECTED,
  MEDIUM,
  NEAR,
  SELECT_BLUE as SELECTED_BLUE,
  VERYFAR
} from '~common-ui/components/map/constants';
import {
  fontStyle,
  imageScale,
  imageScaleSelected,
  selectedPixelOffset,
  stationTriangleOrange,
  stationTriangleWhite,
  unselectedPixelOffset
} from '~data-acquisition-ui/components/soh-map/constants';

import {
  createCartesianFromLocation,
  formatNumberForTooltipDisplay,
  stationTypeToFriendlyNameMap
} from './ian-map-utils';

const stationDistanceDisplayCondition: DistanceDisplayCondition = new DistanceDisplayCondition(
  NEAR,
  VERYFAR
);
const channelGroupDistanceDisplayCondition: DistanceDisplayCondition = new DistanceDisplayCondition(
  NEAR,
  MEDIUM
);
const lineDistanceDisplayCondition: DistanceDisplayCondition = new DistanceDisplayCondition(
  NEAR,
  MEDIUM
);
const selectedDistanceDisplayCondition: DistanceDisplayCondition = new DistanceDisplayCondition(
  0,
  Number.MAX_SAFE_INTEGER
);

/**
 * Given a Cesium entity and a display condition, configure a label for a GEOJSON point.
 *
 * @param item - Station or Channel Group we are creating a label for
 * @param distanceDisplayCondition - DistanceDisplayCondition
 * @param isSelected - is the entity we are creating a label for selected
 */
export function createLabel(
  item: ChannelTypes.ChannelGroup | StationTypes.Station,
  distanceDisplayCondition: DistanceDisplayCondition,
  isSelected: boolean
): LabelGraphics {
  const options: LabelGraphics.ConstructorOptions = {
    backgroundColor: SELECTED_BLUE,
    text: item.name,
    font: fontStyle,
    fillColor: Color.WHITE,
    outlineColor: Color.BLACK,
    outlineWidth: 2,
    showBackground: isSelected,
    style: new ConstantProperty(LabelStyle.FILL_AND_OUTLINE),
    distanceDisplayCondition: new ConstantProperty(
      isSelected ? selectedDistanceDisplayCondition : distanceDisplayCondition
    ),
    verticalOrigin: new ConstantProperty(VerticalOrigin.TOP),
    pixelOffset: new ConstantProperty(isSelected ? selectedPixelOffset : unselectedPixelOffset),
    eyeOffset: new Cartesian3(
      0.0,
      0.0,
      isSelected ? LABEL_HEIGHT_SELECTED : LABEL_HEIGHT_UNSELECTED
    )
  };

  return new LabelGraphics(options);
}

export function createPolyline(
  x: Cartesian3,
  y: Cartesian3,
  distanceDisplayCondition: DistanceDisplayCondition
): PolylineGraphics {
  return new PolylineGraphics({
    distanceDisplayCondition: new ConstantProperty(distanceDisplayCondition),
    material: new ColorMaterialProperty(Color.GRAY),
    positions: [x, y],
    show: true,
    width: new ConstantProperty(1)
  });
}

/**
 * Create a Billboard for a station or ChannelGroup (i.e. the map icon)
 *
 * @param selected : is the entity we are creating a billboard for selected
 * @param stationVisibility
 */
export function createBillboard(
  selected: boolean,
  eyeOffset: ConstantPositionProperty,
  stationVisibility = false
): BillboardGraphics {
  const billboard = new BillboardGraphics();
  billboard.image = stationVisibility ? stationTriangleOrange : stationTriangleWhite;
  billboard.scale = selected
    ? new ConstantProperty(imageScaleSelected)
    : new ConstantProperty(imageScale);
  // triangle pins should have the center of lat/long in middle of shape;
  billboard.horizontalOrigin = new ConstantProperty(HorizontalOrigin.CENTER);
  billboard.verticalOrigin = new ConstantProperty(VerticalOrigin.CENTER);
  billboard.eyeOffset = eyeOffset;

  billboard.color = new ConstantProperty(Color.WHITE);
  return billboard;
}

/**
 * Given a station, return a Cesium map Entity containing a label and a billboard (icon)
 *
 * @param station
 * @param selectedStations
 * @param stationVisibility
 */
export function createMapEntityFromStation(
  station: StationTypes.Station,
  selectedStations: string[],
  stationVisibility: boolean
): Entity {
  const isSelected = selectedStations?.indexOf(station.name) > -1;
  const entityProperties = {
    name: station.name,
    type: 'Station',
    selected: isSelected,
    coordinates: {
      longitude: formatNumberForTooltipDisplay(station.location.longitudeDegrees),
      latitude: formatNumberForTooltipDisplay(station.location.latitudeDegrees),
      elevation: formatNumberForTooltipDisplay(station.location.elevationKm)
    },
    statype: stationTypeToFriendlyNameMap.get(station.type)
  };
  const eyeOffSet = isSelected
    ? new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_SELECTED))
    : new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_UNSELECTED_STATION));

  const entityOptions: Entity.ConstructorOptions = {
    id: station.name,
    name: station.name,
    show: true,
    label: createLabel(station, stationDistanceDisplayCondition, isSelected),
    billboard: createBillboard(isSelected, eyeOffSet, stationVisibility),
    properties: entityProperties,
    position: createCartesianFromLocation(station.location)
  };

  return new Entity(entityOptions);
}

/**
 * Given a channelGroup, return a Cesium map Entity that also contains a Polyline that connects back to its station
 *
 * @param channelGroup
 * @param stationPosition
 */
export function createMapEntityFromChannelGroup(
  channelGroup: ChannelTypes.ChannelGroup,
  stationPosition: Cartesian3
): Entity {
  const isSelected = false; // cannot select channelGroups
  const entityProperties = {
    name: channelGroup.name,
    type: 'ChannelGroup',
    selected: isSelected,
    coordinates: {
      longitude: formatNumberForTooltipDisplay(channelGroup.location.longitudeDegrees),
      latitude: formatNumberForTooltipDisplay(channelGroup.location.latitudeDegrees),
      elevation: formatNumberForTooltipDisplay(channelGroup.location.elevationKm)
    }
  };
  const channelGroupPosition = createCartesianFromLocation(channelGroup.location);
  const eyeOffSet = isSelected
    ? new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_SELECTED))
    : new ConstantPositionProperty(new Cartesian3(0.0, 0.0, BILLBOARD_HEIGHT_UNSELECTED_CHANNEL));
  const entityOptions: Entity.ConstructorOptions = {
    id: channelGroup.name,
    name: channelGroup.name,
    show: true,
    label: createLabel(channelGroup, channelGroupDistanceDisplayCondition, isSelected),
    billboard: createBillboard(isSelected, eyeOffSet),
    properties: entityProperties,
    position: channelGroupPosition,
    polyline: createPolyline(channelGroupPosition, stationPosition, lineDistanceDisplayCondition)
  };

  return new Entity(entityOptions);
}

/**
 * Given a ChannelGroup array and Station Location, this function returns an array of ChannelGroups that are unique by
 * latitude and longitude with respect to all other ChannelGroups and the Station Location
 *
 * Two ChannelGroups that have the same latitude and longitude but have a different elevation are not considered unique
 *
 * When duplicate ChannelGroups are found, the first one in the array is kept
 *
 * When a ChannelGroup Location matches the stationLocation, it is dropped (Station trumps ChannelGroup)
 *
 * @param channelGroups The array to be reduced
 * @param stationLocation Any ChannelGroup Locations that match the Station Location will also be dropped
 */
export function getUniquelyLocatedChannelGroups(
  channelGroups: ChannelTypes.ChannelGroup[],
  stationLocation: ChannelTypes.Location
): ChannelTypes.ChannelGroup[] {
  if (!channelGroups || channelGroups.length === 0) return [];

  // get array of ChannelGroups with unique locations
  const uniquelyLocatedChannelGroups = uniqWith(
    channelGroups,
    (cg1, cg2) =>
      cg1.location.longitudeDegrees === cg2.location.longitudeDegrees &&
      cg1.location.latitudeDegrees === cg2.location.latitudeDegrees
  );

  // drop any channel groups that match the station location and return the more unique list
  return uniquelyLocatedChannelGroups.filter(channelGroup => {
    return (
      channelGroup.location.longitudeDegrees !== stationLocation.longitudeDegrees &&
      channelGroup.location.latitudeDegrees !== stationLocation.latitudeDegrees
    );
  });
}

/**
 * Given a station, return an array of Cesium Entities containing data for each of the station's uniquely
 * located (by lat, long) channel groups
 * ChannelGroups that do not have a unique latitude and longitude pair are dropped, we may want to consider keeping
 * track of them in the future
 *
 * @param station - Station containing the sites to be converted into entities
 */
export function processChannelGroups(station: StationTypes.Station): Entity[] {
  if (!station.channelGroups || station.channelGroups.length === 0) return [];

  const stationLocation = createCartesianFromLocation(station.location);
  const uniqueChannelGroupLocations: ChannelTypes.ChannelGroup[] = getUniquelyLocatedChannelGroups(
    station.channelGroups,
    station.location
  );

  return uniqueChannelGroupLocations.map(channelGroup =>
    createMapEntityFromChannelGroup(channelGroup, stationLocation)
  );
}

/**
 * Given an array of Stations, parses through the array to create a Cesium Entity array for each Station
 * and uniquely located (by long, lat) ChannelGroup with proper labels, icons, and distanceDisplayConditions
 *
 * @param stations
 * @param selectedStations
 * @param stationsVisibility
 */
export function createMapEntitiesFromStationArray(
  stations: StationTypes.Station[],
  selectedStations: string[],
  stationsVisibility: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>
): Entity[] {
  const entities: Entity[] = [];
  if (!stations || !stations.length) {
    return entities;
  }

  stations.forEach(station => {
    entities.push(
      createMapEntityFromStation(
        station,
        selectedStations,
        stationsVisibility?.get(station.name)?.visibility
      )
    );
    processChannelGroups(station).forEach(entity => entities.push(entity));
  });

  return entities;
}
