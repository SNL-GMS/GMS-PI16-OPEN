/* eslint-disable import/namespace */
/* eslint-disable no-underscore-dangle */
import { ContextMenu } from '@blueprintjs/core';
import { GLDisplayState } from '@gms/ui-state/lib/state/common-workspace/types';
import Immutable from 'immutable';

import * as IanMapUtils from '../../../../../src/ts/components/analyst-ui/components/map/ian-map-utils';

jest.mock('@blueprintjs/core', () => {
  const actualBlueprint = jest.requireActual('@blueprintjs/core');
  return {
    ...actualBlueprint,
    ContextMenu: {
      show: jest.fn()
    }
  };
});

describe('ian map utils', () => {
  test('are defined', () => {
    expect(IanMapUtils.getObjectFromPoint).toBeDefined();
    expect(IanMapUtils.ianMapTooltipLabel).toBeDefined();
    expect(IanMapUtils.ianMapTooltipHandleMouseMove).toBeDefined();
    expect(IanMapUtils.getOnRightClickHandler).toBeDefined();
  });
  test('ianMapTooltipLabel should match snapshot', () => {
    expect(IanMapUtils.ianMapTooltipLabel).toMatchSnapshot();
  });

  test('getObjectFromPoint should match snapshot', () => {
    const pickedFeature = { id: 'myId' };
    const viewer = {
      scene: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        pick: jest.fn(position => pickedFeature),
        requestRender: jest.fn()
      }
    };
    const endPosition = { x: 10, y: 10 };
    const pickedFeatureId = IanMapUtils.getObjectFromPoint(viewer as any, endPosition as any);
    expect(pickedFeatureId).toEqual(pickedFeature.id);
  });

  test('getObjectFromPoint should return undefined if there is no feature defined', () => {
    const viewer = {
      scene: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        pick: jest.fn(position => undefined),
        requestRender: jest.fn()
      }
    };
    const endPosition = {};
    const pickedFeatureId = IanMapUtils.getObjectFromPoint(viewer as any, endPosition as any);
    expect(pickedFeatureId).toBeUndefined();
  });

  describe('ianMap right click context menu', () => {
    const stationsVisibility = {
      get: jest.fn(() => {
        return {
          visibility: true,
          station: {}
        };
      })
    };
    const stationsVisibilityFalse = {
      get: jest.fn(() => {
        return {
          visibility: false,
          station: {}
        };
      })
    };

    const selectedEntityStation: any = {
      id: 'AAK',
      properties: {
        type: {
          getValue: jest.fn(() => 'Station')
        }
      }
    };
    const selectedEntityNonStation: any = {
      id: 'AAK',
      properties: {
        type: {
          getValue: jest.fn(() => 'oeui')
        }
      }
    };
    const movementEvent: any = {
      position: {
        x: 3,
        y: 8
      }
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('when a station is clicked, vis: true', () => {
      const handler = IanMapUtils.getOnRightClickHandler(stationsVisibility as any, jest.fn());
      handler(movementEvent, selectedEntityStation);
      expect(ContextMenu.show).toBeCalledTimes(1);
    });

    it('when a non-station is clicked, vis: true', () => {
      const handler = IanMapUtils.getOnRightClickHandler(stationsVisibility as any, jest.fn());
      handler(movementEvent, selectedEntityNonStation);
      expect(ContextMenu.show).toBeCalledTimes(0);
    });

    it('when a station is clicked, vis: false', () => {
      const handler = IanMapUtils.getOnRightClickHandler(stationsVisibilityFalse as any, jest.fn());
      handler(movementEvent, selectedEntityStation);
      expect(ContextMenu.show).toBeCalledTimes(1);
    });

    it('when a non-station is clicked, vis: false', () => {
      const handler = IanMapUtils.getOnRightClickHandler(stationsVisibilityFalse as any, jest.fn());
      handler(movementEvent, selectedEntityNonStation);
      expect(ContextMenu.show).toBeCalledTimes(0);
    });
  });

  describe('ianMapTooltipHandleMouseMove', () => {
    const movement = {
      endPosition: 'position'
    };
    const viewer = {
      scene: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        pickPosition: jest.fn(endPosition => {
          return 'myPosition';
        }),
        requestRender: jest.fn()
      },
      entities: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getById: jest.fn(id => {
          return undefined;
        }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        add: jest.fn(incomingEntity => {
          return IanMapUtils.ianMapTooltipLabelOptions;
        })
      }
    };

    const stationProperties = {
      coordinates: {
        _value: {
          latitude: 100,
          longitude: 100,
          elevation: 100
        }
      },
      statype: {
        _value: 'SEISMIC_3_COMPONENT'
      },
      type: 'Station'
    };

    const channelGroupProperties = {
      coordinates: {
        _value: {
          latitude: 100,
          longitude: 100,
          elevation: 100
        }
      },
      type: 'ChannelGroup'
    };

    beforeEach(() => {
      jest.clearAllMocks();
      // reassign getObjectFromPoint to get a empty entity back
      // like we would if nothing is below the hovered point
      Object.assign(IanMapUtils, {
        ...IanMapUtils,
        getObjectFromPoint: () => {
          return {};
        }
      });
    });

    test('should handle updating the labels for a Station', () => {
      const selectedEntityStation = {
        name: 'AAK',
        properties: { getValue: jest.fn(() => stationProperties) }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaultLabelEntity: any = IanMapUtils.ianMapTooltipHandleMouseMove(
        movement,
        viewer as any
      );
      // make sure our ID is correct
      expect(defaultLabelEntity.id).toEqual('labelEntity');
      expect(defaultLabelEntity).toMatchSnapshot();
      expect(defaultLabelEntity.label.show._value).toBeFalsy();
      expect(viewer.entities.getById).toBeCalledTimes(1);
      expect(viewer.entities.add).toBeCalledTimes(1);

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(IanMapUtils, {
        ...IanMapUtils,
        getObjectFromPoint: () => {
          return selectedEntityStation;
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelEntity: any = IanMapUtils.ianMapTooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('labelEntity');
      expect(labelEntity.label.show._value).toBeTruthy();
      expect(labelEntity).toMatchSnapshot();
      expect(viewer.entities.getById).toBeCalledTimes(2);
      expect(viewer.entities.add).toBeCalledTimes(2);
    });

    test('should handle updating the labels for a Channel Group', () => {
      const selectedEntityChannelGroup = {
        name: 'AAK0',
        properties: { getValue: jest.fn(() => channelGroupProperties) }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaultLabelEntity: any = IanMapUtils.ianMapTooltipHandleMouseMove(
        movement,
        viewer as any
      );
      // make sure our ID is correct
      expect(defaultLabelEntity.id).toEqual('labelEntity');
      expect(defaultLabelEntity.label.show._value).toBeFalsy();
      expect(viewer.entities.getById).toBeCalledTimes(1);
      expect(viewer.entities.add).toBeCalledTimes(1);

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(IanMapUtils, {
        ...IanMapUtils,
        getObjectFromPoint: () => {
          return selectedEntityChannelGroup;
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelEntity: any = IanMapUtils.ianMapTooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('labelEntity');
      expect(labelEntity).toMatchSnapshot();
      expect(labelEntity.label.show._value).toBeTruthy();

      expect(viewer.entities.getById).toBeCalledTimes(2);
      expect(viewer.entities.add).toBeCalledTimes(2);
    });

    test('should not show a tooltip if the hovered entity has no properties', () => {
      const selectedEntityChannelGroupNoProperties = {
        name: 'AAK0'
      };

      // reassign getObjectFromPoint to get a correct entity back
      Object.assign(IanMapUtils, {
        ...IanMapUtils,
        getObjectFromPoint: () => {
          return selectedEntityChannelGroupNoProperties;
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelEntity: any = IanMapUtils.ianMapTooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('labelEntity');
      expect(labelEntity.label.show._value).toBe(false);
    });

    test('should not show a tooltip if the hovered entity is not a station or channel group', () => {
      const selectedEntityWrongType =
        // reassign getObjectFromPoint to get a correct entity back
        Object.assign(IanMapUtils, {
          ...IanMapUtils,
          getObjectFromPoint: () => {
            return selectedEntityWrongType;
          }
        });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labelEntity: any = IanMapUtils.ianMapTooltipHandleMouseMove(movement, viewer as any);
      // make sure our ID is correct
      expect(labelEntity.id).toEqual('labelEntity');
      expect(labelEntity.label.show._value).toBe(false);
    });

    test('WaveformDisplay is Open returns true when provided array contains waveform display', () => {
      const waveformOpen = Immutable.Map<string, GLDisplayState>().set(
        'waveform-display',
        GLDisplayState.OPEN
      );
      const waveformClosed = Immutable.Map<string, GLDisplayState>().set(
        'waveform-display',
        GLDisplayState.CLOSED
      );
      const waveformNotInMap = Immutable.Map<string, GLDisplayState>().set(
        'waeoui',
        GLDisplayState.OPEN
      );

      expect(IanMapUtils.waveformDisplayIsOpen(Immutable.Map<string, GLDisplayState>())).toEqual(
        false
      );
      expect(IanMapUtils.waveformDisplayIsOpen(undefined)).toEqual(false);
      expect(IanMapUtils.waveformDisplayIsOpen(null)).toEqual(false);

      expect(IanMapUtils.waveformDisplayIsOpen(waveformOpen)).toEqual(true);
      expect(IanMapUtils.waveformDisplayIsOpen(waveformClosed)).toEqual(false);
      expect(IanMapUtils.waveformDisplayIsOpen(waveformNotInMap)).toEqual(false);
    });
  });
});
