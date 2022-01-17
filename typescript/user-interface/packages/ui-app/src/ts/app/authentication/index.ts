import { IS_MODE_IAN } from '@gms/common-util';

import { ianAuthenticator } from './ian-authentication';
import { sohAuthenticator } from './soh-authentication';
import { Authenticator } from './types';

export const authenticator: Authenticator = IS_MODE_IAN ? ianAuthenticator : sohAuthenticator;
