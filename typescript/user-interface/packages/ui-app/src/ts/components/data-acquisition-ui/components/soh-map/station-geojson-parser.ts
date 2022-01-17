import { ProcessingStationTypes, SohTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-apollo';
import isEqual from 'lodash/isEqual';
import memoizeOne from 'memoize-one';

import { getWorstCapabilityRollup } from '~components/data-acquisition-ui/shared/table/utils';

import { colorDictionary } from './constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const GeoJSON = require('geojson');

const geoJsonParser = (
  stations: ProcessingStationTypes.ProcessingStation[],
  stationSoh: SohTypes.UiStationSoh[],
  selectedStationIds: string[],
  isShowSohStatusSummary: boolean
) => {
  const stationData = [];
  stationSoh.forEach(s => {
    const station = stations?.find(ps => ps.name === s.stationName);
    const status = isShowSohStatusSummary
      ? s.sohStatusSummary
      : getWorstCapabilityRollup(s.stationGroups);
    if (station) {
      stationData.push({
        name: station.name,
        selected: selectedStationIds && selectedStationIds.includes(s.stationName),
        status,
        color: colorDictionary[status],
        location: station.location
      });
    } else {
      UILogger.Instance().warn(`Failed to create GEO JSON data for station: ${s.stationName}`);
    }
  });

  const geoJsonStationData = GeoJSON.parse(stationData, {
    Point: ['location.latitudeDegrees', 'location.longitudeDegrees'],
    include: ['name', 'selected', 'status', 'color']
  });
  return geoJsonStationData;
};

export const getStationsAsGeoJson: (
  stations: ProcessingStationTypes.ProcessingStation[],
  stationSoh: SohTypes.UiStationSoh[],
  selectedStationIds: string[],
  isShowSohStatusSummary: boolean
) => any = memoizeOne(geoJsonParser, isEqual);
