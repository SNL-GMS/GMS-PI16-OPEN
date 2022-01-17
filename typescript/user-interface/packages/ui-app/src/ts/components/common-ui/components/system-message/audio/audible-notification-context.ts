import { UserProfileTypes } from '@gms/common-model';
import * as React from 'react';
import { MutationFetchResult } from 'react-apollo';

import { AudibleNotificationMutationArgs } from '~components/client-interface/axios/types';

export interface AudibleNotificationContextData {
  audibleNotifications: UserProfileTypes.AudibleNotification[];
  setAudibleNotifications(
    mutationArgs: AudibleNotificationMutationArgs
  ): Promise<MutationFetchResult>;
}

/**
 * The audible notification context
 */
export const AudibleNotificationContext: React.Context<AudibleNotificationContextData> = React.createContext<
  AudibleNotificationContextData
>(undefined);
