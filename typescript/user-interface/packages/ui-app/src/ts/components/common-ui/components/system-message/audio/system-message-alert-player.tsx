/* eslint-disable react/prop-types */
/* eslint-disable react/destructuring-assignment */
import { SystemMessageTypes } from '@gms/common-model';
import { UILogger } from '@gms/ui-apollo';
import { Toaster } from '@gms/ui-util';
import head from 'lodash/head';
import last from 'lodash/last';
import partialRight from 'lodash/partialRight';
import sortBy from 'lodash/sortBy';
import * as React from 'react';

import { Queries } from '~components/client-interface';
import { userPreferences } from '~components/common-ui/config/user-preferences';

import { AudibleNotificationContext } from './audible-notification-context';

const BASE_SOUNDS_PATH = userPreferences.baseSoundsPath;

interface SystemMessageAlertProps {
  id?: string;
  isSoundEnabled: boolean;
  latestSystemMessages: SystemMessageTypes.SystemMessage[];
}

const severityOrder = {
  INFO: 2,
  WARNING: 1,
  CRITICAL: 0
};

const toaster = new Toaster();

/**
 * Pick a single system message based on highest severity and most recent.
 *
 * @param latestMessages - System Messages received.
 * @returns - undefined or a single SystemMessage.
 */
const pickSystemMessage = (
  latestMessages: SystemMessageTypes.SystemMessage[]
): SystemMessageTypes.SystemMessage | undefined => {
  const sortBySeverity = partialRight(sortBy, [a => severityOrder[a.severity]]);
  const sortByDateAndId = partialRight(sortBy, [a => a.time, a => a.id]);

  let mostSevereList: SystemMessageTypes.SystemMessage[] = sortBySeverity(latestMessages);
  const mostSevere = head(mostSevereList)?.severity;
  mostSevereList = mostSevereList.filter(systemMessage => systemMessage.severity === mostSevere);
  const sorted: SystemMessageTypes.SystemMessage = last(sortByDateAndId(mostSevereList));
  return sorted;
};

export const SystemMessageAlertPlayer: React.FunctionComponent<SystemMessageAlertProps> = props => {
  const context = React.useContext(AudibleNotificationContext);
  const userProfile = Queries.UserProfileQuery.useUserProfileQuery()?.data;
  const audibleNotifications = userProfile?.audibleNotifications ?? context.audibleNotifications;
  const refs = React.useRef(new Map<string, HTMLAudioElement>());

  const configuredSounds: SystemMessageTypes.SystemMessage[] = props.latestSystemMessages?.filter(
    message =>
      audibleNotifications?.find(
        notification =>
          SystemMessageTypes.SystemMessageType[message.type] ===
          SystemMessageTypes.SystemMessageType[notification.notificationType]
      )
  );

  const sorted: SystemMessageTypes.SystemMessage = pickSystemMessage(configuredSounds);

  const sound = sorted
    ? audibleNotifications?.find(
        notification =>
          SystemMessageTypes.SystemMessageType[notification.notificationType] ===
          SystemMessageTypes.SystemMessageType[sorted.type]
      )?.fileName
    : undefined;

  const shouldUseEffect = props.latestSystemMessages
    ? JSON.stringify(sortBy([...props.latestSystemMessages], [a => a.id]))
    : undefined;

  React.useEffect(() => {
    if (sound && refs.current.has(sound) && props.isSoundEnabled) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refs.current
        .get(sound)
        .play()
        .catch(e => {
          UILogger.Instance().error(`Failed to play alert ${sound}: ${e}`);
          toaster.toastError(userPreferences.configuredAudibleNotificationFileNotFound(sound));
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUseEffect]);

  return (
    <>
      {audibleNotifications &&
        audibleNotifications.map(notification => (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio
            ref={ref => {
              refs.current.set(notification.fileName, ref);
            }}
            key={notification.fileName}
            src={`${BASE_SOUNDS_PATH}${notification.fileName}`}
          />
        ))}
    </>
  );
};
