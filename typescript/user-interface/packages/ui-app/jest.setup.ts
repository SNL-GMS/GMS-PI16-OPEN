/* eslint-disable import/no-extraneous-dependencies */
import { mount, render, shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import { GlobalWithFetchMock } from 'jest-fetch-mock';

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock;
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
customGlobal.fetch = require('jest-fetch-mock');

customGlobal.fetchMock = customGlobal.fetch;

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('jest-canvas-mock');

// TODO: Remove this `raf` polyfill once the below issue is sorted
// https://github.com/facebookincubator/create-react-app/issues/3199#issuecomment-332842582
// @see https://medium.com/@barvysta/warning-react-depends-on-requestanimationframe-f498edd404b3
const globalAny: any = global;

// eslint-disable-next-line no-multi-assign
export const raf = (globalAny.requestAnimationFrame = cb => {
  setTimeout(cb, 0);
});

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

// React Enzyme adapter
Enzyme.configure({ adapter: new Adapter() });

// Make Enzyme functions available in all test files without importing
globalAny.shallow = shallow;
globalAny.render = render;
globalAny.mount = mount;
globalAny.toJson = toJson;
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
globalAny.window = window;

// eslint-disable-next-line @typescript-eslint/no-require-imports
globalAny.$ = require('jquery');

globalAny.jQuery = globalAny.$;
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
globalAny.fetch = require('jest-fetch-mock');
// create range was missing on documents mock
globalAny.document.createRange = () => ({
  setStart: jest.fn(),
  setEnd: jest.fn(),
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document
  }
});
globalAny.window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

jest.mock('axios', () => {
  const success = 'success';
  const actualAxios = jest.requireActual('axios');
  return {
    ...actualAxios,
    request: jest.fn().mockReturnValue(Promise.resolve(success))
  };
});

jest.mock('cesium', () => {
  return {
    ...jest.requireActual('cesium'),
    BillboardGraphics: jest.fn(x => x),
    buildModuleUrl: jest.fn(),
    Camera: {
      DEFAULT_VIEW_FACTOR: 0
    },
    Cartesian2: jest.requireActual('cesium').Cartesian2,
    Cartesian3: jest.requireActual('cesium').Cartesian3,
    Color: {
      WHITE: '0000',
      GRAY: '5656',
      fromCssColorString: jest.fn(() => '')
    },
    ColorMaterialProperty: jest.requireActual('cesium').ColorMaterialProperty,
    ConstantProperty: jest.fn(x => {
      return {
        _value: x,
        getValue: jest.fn(() => x)
      };
    }),
    ConstantPositionProperty: jest.fn(x => x),
    defined: jest.fn(x => x),
    DistanceDisplayCondition: jest.fn(),
    EllipsoidTerrainProvider: {},
    Entity: jest.requireActual('cesium').Entity,
    EntityCollection: jest.fn(x => x),
    GeoJsonDataSource: {},
    HorizontalOrigin: {
      CENTER: 0
    },
    JulianDate: {
      now: jest.fn(() => 0)
    },
    LabelGraphics: jest.fn(x => {
      return {
        _value: x,
        getValue: jest.fn(() => x)
      };
    }),
    LabelStyle: {
      FILL_AND_OUTLINE: 0
    },
    PolylineGraphics: jest.fn(x => x),
    ProviderViewModel: jest.fn(),
    SceneMode: {
      SCENE2D: true
    },
    ScreenSpaceEventType: {
      MOUSE_MOVE: 'MOUSE_MOVE'
    },
    TileMapServiceImageryProvider: jest.fn(),
    VerticalOrigin: {
      TOP: 0,
      CENTER: 0
    },
    Viewer: {
      scene: {
        pickPosition: jest.fn(x => x)
      }
    }
  };
});
jest.mock('resium', () => {
  return {
    Camera: {
      DEFAULT_VIEW_FACTOR: 0
    },
    CameraFlyTo: {},
    CesiumComponentRef: {},
    CesiumMovementEvent: {},
    ImageryLayer: {},
    cesiumElement: {},
    Viewer: {
      scene: {
        pickPosition: jest.fn(x => x)
      }
    }
  };
});
jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockReturnValue({
      domElement: document.createElement('div'), // create a fake div
      setSize: jest.fn(),
      render: jest.fn(),
      setScissorTest: jest.fn(),
      setViewport: jest.fn()
    })
  };
});
jest.mock('worker-rpc', () => {
  const realWorkerRpc = jest.requireActual('worker-rpc');
  // We do this here to guarantee that it runs before the waveform panel generates its workers.
  // This works because jest.mock gets hoisted and run before even imports are figured out.
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    writable: false,
    value: 4
  });

  // We don't actually need to mock anything in the worker-rpc module... just to hijack the
  // window before it runs.
  return {
    ...realWorkerRpc,
    RPCProvider: {
      constructor: () => ({
        _dispatch: jest.fn(),
        _nextTransactionId: 0,
        _pendingTransactions: {},
        _rpcHandlers: {},
        _rpcTimeout: 0,
        _signalHandlers: {},
        error: {
          _contexts: [],
          _handlers: [],
          dispatch: jest.fn(),
          hasHandlers: false
        }
      })
    }
  };
});
