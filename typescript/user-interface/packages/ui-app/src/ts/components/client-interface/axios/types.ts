/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ConfigurationTypes,
  EventTypes,
  QcMaskTypes,
  SignalDetectionTypes,
  StationTypes,
  SystemMessageTypes,
  UserProfileTypes
} from '@gms/common-model';
import { QueryResult } from 'react-query';

export interface AudibleNotificationMutationArgs {
  variables: {
    audibleNotificationsInput: UserProfileTypes.AudibleNotification[];
  };
}

export interface UserProfileMutationArgs {
  variables: {
    userProfile: UserProfileTypes.UserProfile;
  };
}

export interface SetLayoutMutationArgs {
  workspaceLayoutInput: UserProfileTypes.UserLayout;
  saveAsDefaultLayoutOfType?: UserProfileTypes.DefaultLayoutNames;
}

export interface StationDefinitionQueryProps {
  stationDefinitionsQuery: QueryResult<StationTypes.Station[]>;
}

export type StationDefinitionQueryResults = QueryResult<StationTypes.Station[]>;

export interface SystemMessageDefinitionsQueryProps {
  systemMessageDefinitionsQuery: QueryResult<SystemMessageTypes.SystemMessageDefinition[], any>;
}

export interface ProcessingAnalystConfigurationQueryProps {
  processingAnalystConfigurationQuery: QueryResult<
    ConfigurationTypes.ProcessingAnalystConfiguration,
    any
  >;
}

export interface ProcessingCommonConfigurationQueryProps {
  processingCommonConfigurationQuery: QueryResult<
    ConfigurationTypes.ProcessingCommonConfiguration,
    any
  >;
}

export interface OperationalTimePeriodConfigurationQueryProps {
  operationalTimePeriodConfigurationQuery: QueryResult<
    ConfigurationTypes.OperationalTimePeriodConfiguration,
    any
  >;
}
export interface UserProfileQueryProps {
  userProfileQuery: QueryResult<UserProfileTypes.UserProfile, any>;
}

// TODO: add type for query results when this query is implemented
export interface EventQueryProps {
  eventQuery: QueryResult<EventTypes.Event[], any>;
}

// TODO: add type for query results when this query is implemented
export interface SignalDetectionsQueryProps {
  signalDetectionQuery: QueryResult<SignalDetectionTypes.SignalDetection[], any>;
}

// TODO: add type for query results when this query is implemented
export interface QCMaskQueryProps {
  qcMaskQuery: QueryResult<QcMaskTypes.QcMask[], any>;
}

export interface CloudEvent {
  id: string;
  source: string;
  specversion: string;
  type: string;
  data: unknown;
}

export interface RigConnection extends CloudEvent {
  data: {
    connection_token: string;
  };
}

export const isRigConnection = (object: CloudEvent): object is RigConnection =>
  object.type === 'rig.connection.create';
