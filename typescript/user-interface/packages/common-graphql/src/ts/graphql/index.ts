import * as GQLTypes from './types';

export { GQLTypes };

export { CacheGqls, CacheMutations, CacheQueries } from './cache';
export { ChannelSegmentGqls } from './channel-segment';
export { CommonGqls, CommonMutations, CommonQueries, CommonSubscriptions } from './common';
export {
  DataAcquisitionGqls,
  DataAcquisitionMutations,
  DataAcquisitionQueries
} from './data-acquisition';
export { EventGqls, EventMutations, EventQueries, EventSubscriptions } from './event';
export { FkGqls, FkMutations, FkQueries } from './fk';
export { fragmentSchema } from './fragment-schema';
export { fragmentSchemaSOH } from './fragment-schema-soh';
export { QcMaskGqls, QcMaskMutations, QcMaskQueries, QcMaskSubscriptions } from './qc-mask';
export {
  SignalDetectionGqls,
  SignalDetectionMutations,
  SignalDetectionQueries,
  SignalDetectionSubscriptions
} from './signal-detection';
export { SohGqls, SohMutations, SohQueries, SohSubscriptions } from './soh';
export { ProcessingStationGqls, ProcessingStationQueries } from './station-processing';
export { ReferenceStationGqls, ReferenceStationQueries } from './station-reference';
export {
  SystemMessageGqls,
  SystemMessageQueries,
  SystemMessageSubscriptions
} from './system-message';
export { ConfigurationGqls, ConfigurationQueries } from './ui-configuration';
export { WaveformGqls, WaveformQueries, WaveformSubscriptions } from './waveform';
