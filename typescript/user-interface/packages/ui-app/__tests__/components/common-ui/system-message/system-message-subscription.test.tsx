import { uuid } from '@gms/common-util';
import { createStore } from '@gms/ui-state';
import * as React from 'react';

import { withApolloProvider } from '../../../../src/ts/app/apollo-provider';
import { withReduxProvider } from '../../../../src/ts/app/redux-provider';
import { wrapSystemMessageSubscription } from '../../../../src/ts/components/common-ui/components/system-message/system-message-subscription';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';
let idCount = 0;
// eslint-disable-next-line no-plusplus
uuid.asString = jest.fn().mockImplementation(() => ++idCount);

describe('System Message Component', () => {
  it('should be defined', () => {
    expect(wrapSystemMessageSubscription).toBeDefined();
  });

  const store: any = createStore();

  const Wrapper = withReduxProvider(
    withApolloProvider(wrapSystemMessageSubscription(React.Fragment, {}), store),
    store
  );

  const systemMessageDisplay: any = Enzyme.mount(<Wrapper />);

  it('matches snapshot', () => {
    expect(systemMessageDisplay).toMatchSnapshot();
  });
});
