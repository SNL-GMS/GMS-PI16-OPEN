import { CommonWorkspaceActions, CommonWorkspaceTypes, createStore } from '@gms/ui-state';
import Immutable from 'immutable';
import React from 'react';
import { Provider } from 'react-redux';

import { data } from '../../../../../src/ts/components/analyst-ui/components/station-properties/mock-station-data';
import { useRenderMapOnSelection } from '../../../../../src/ts/components/common-ui/components/map/map-util';
import { waitForComponentToPaint } from '../../../../utils/general-utils';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
jest.mock('react-redux', () => {
  const actualRedux = jest.requireActual('react-redux');
  return {
    ...actualRedux,
    useDispatch: jest.fn(() => jest.fn())
  };
});
const { station } = data;
const validMap: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject> = Immutable.Map<
  string,
  CommonWorkspaceTypes.StationVisibilityObject
>([[station.name, { visibility: true, station }]]);
describe('Command Palette Component', () => {
  const expectuseRenderMapOnSelectionToCallFunc = async () => {
    const viewerRef: any = {
      current: {
        cesiumElement: {
          scene: {
            requestRender: jest.fn()
          }
        }
      }
    };

    const TestComponent: React.FC = () => {
      useRenderMapOnSelection(viewerRef);
      return null;
    };

    const store = createStore();
    store.dispatch(CommonWorkspaceActions.setStationsVisibility(validMap));

    // Mounting may call the request, if React decides to run it soon.
    const wrapper = Enzyme.mount(
      <Provider store={store}>
        <TestComponent />
      </Provider>
    );

    // This ensures that the axios request will have been called.
    await waitForComponentToPaint(wrapper);
    expect(viewerRef.current.cesiumElement.scene.requestRender).toHaveBeenCalledTimes(1);
  };
  it('should be defined', () => {
    expect(useRenderMapOnSelection).toBeDefined();
  });
  // eslint-disable-next-line jest/expect-expect
  it('should call use effect ref', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    expectuseRenderMapOnSelectionToCallFunc();
  });
});
