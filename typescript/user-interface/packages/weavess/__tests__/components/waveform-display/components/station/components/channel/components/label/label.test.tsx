/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { WeavessTypes } from '@gms/weavess-core';
import { ReactWrapper, ShallowWrapper } from 'enzyme';
import { finance, hacker, internet, random, seed } from 'faker';
import * as React from 'react';

// eslint-disable-next-line max-len
import { Label } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/label/label';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

const fakerDummyWaveformSeed = 123;
seed(fakerDummyWaveformSeed);

let labelProps: WeavessTypes.LabelProps;
let labelContainer: ReactWrapper;
let shallowWrapper: ShallowWrapper;
let wrapper: ReactWrapper;

const toggleExpansion = jest.fn();

function generateDisplayType(): WeavessTypes.DisplayType[] {
  const displayTypes: WeavessTypes.DisplayType[] = [];
  for (let i = 0; i < random.number({ min: 1, max: 3 }); i += 1) {
    displayTypes.push(WeavessTypes.DisplayType[random.objectElement(WeavessTypes.DisplayType)]);
  }
  return displayTypes;
}

function generateDataSegment(): WeavessTypes.DataSegment {
  const values: number[] = [];
  for (let i = 0; i < random.number({ min: 10, max: 100 }); i += 1) {
    values.push(random.number({ min: -200, max: 200, precision: 3 }));
  }
  return {
    data: {
      startTimeSecs: 1610000000,
      endTimeSecs: 1610001000,
      sampleRate: random.number({ min: 20, max: 100 }),
      values
    },
    color: random.arrayElement([undefined, internet.color()]),
    displayType: random.arrayElement([undefined, generateDisplayType()]),
    pointSize: random.arrayElement([undefined, random.number({ min: 1, max: 100 })])
  };
}

function generateDataSegments(): WeavessTypes.DataSegment[] {
  const dataSegments: WeavessTypes.DataSegment[] = [];
  for (let i = 0; i < random.number({ min: 10, max: 100 }); i += 1) {
    dataSegments.push(generateDataSegment());
  }
  return dataSegments;
}

function generateChannelSegment(): WeavessTypes.ChannelSegment {
  return {
    channelName: 'LabelChannel',
    wfFilterId: WeavessTypes.UNFILTERED,
    description: random.arrayElement([undefined, hacker.phrase()]),
    descriptionLabelColor: random.arrayElement([undefined, internet.color()]),

    dataSegments: generateDataSegments()
  };
}

function generateChannelSegments(): Map<string, WeavessTypes.ChannelSegment> {
  const channelSegmentsMap: Map<string, WeavessTypes.ChannelSegment> = new Map();

  for (let i = 0; i < random.number({ min: 1, max: 3 }); i += 1) {
    channelSegmentsMap.set(random.uuid(), generateChannelSegment());
  }

  return channelSegmentsMap;
}

function generateChannelConfig(): WeavessTypes.Channel {
  return {
    id: random.uuid(),
    name: finance.currencyCode(),
    channelType: undefined,
    waveform: {
      channelSegmentId: random.uuid(),
      channelSegments: generateChannelSegments(),
      masks: undefined,
      signalDetections: undefined,
      theoreticalPhaseWindows: undefined
    }
  };
}

function generateLabelProps(): WeavessTypes.LabelProps {
  const channel = generateChannelConfig();
  return {
    channel,
    channelName: channel.id,
    isDefaultChannel: true,
    isExpandable: true,
    expanded: false,
    yAxisBounds: [
      {
        heightInPercentage: 50,
        minAmplitude: random.number({ min: 10, max: 50 }),
        maxAmplitude: random.number({ min: 150, max: 200 })
      }
    ],
    // selectedChannels: undefined,
    selections: {
      channels: []
    },
    showMaskIndicator: false,
    distance: random.number({ min: 50, max: 1000 }),
    // assumption for this is that element name and element value are identical (case-sensitive)
    distanceUnits: WeavessTypes.DistanceUnits[random.objectElement(WeavessTypes.DistanceUnits)],
    events: undefined,
    toggleExpansion
  };
}

function fakeChannelLabelClick(e: React.MouseEvent<HTMLDivElement>, channelId: string): void {
  if (labelProps && labelProps.selections.channels) {
    labelProps.selections.channels.push(channelId);
  }
  // labelContainer.get(0).props.style.textShadow = '0px 1px 15px';
  wrapper.setProps({ style: { textShadow: '0px 1px 15px' } });
}

function fakeOnChannelExpanded(): void {
  if (labelProps) {
    labelProps.expanded = true;
    wrapper.setProps(labelProps);
  }
}

function fakeOnChannelCollapsed(): void {
  if (labelProps) {
    labelProps.expanded = false;
    wrapper.setProps(labelProps);
  }
}

function generateUpdatedLabelEvents(): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChannelExpanded: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChannelCollapsed: any;
  onChannelLabelClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, channelId: string) => void;
} {
  return {
    onChannelExpanded: fakeOnChannelExpanded,
    onChannelCollapsed: fakeOnChannelCollapsed,
    onChannelLabelClick: fakeChannelLabelClick
  };
}

describe('Label Tests', () => {
  beforeEach(() => {
    Enzyme.configure({ adapter: new Adapter() });
  });

  test('label displays proper distance units', () => {
    labelProps = generateLabelProps();

    labelProps.distanceUnits = WeavessTypes.DistanceUnits.km;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    labelProps.distance = 555.557;

    const expectedValue = '555.56 km ';

    // eslint-disable-next-line react/jsx-props-no-spreading
    shallowWrapper = Enzyme.shallow(<Label {...labelProps} />);

    // css selector for p child of div
    const distanceLabel = shallowWrapper.find('div.label-container-content-label p');

    // sanity check for <p>
    expect(distanceLabel).toHaveLength(1);
    expect(distanceLabel.text()).toMatch(expectedValue);
  });

  // eslint-disable-next-line jest/no-done-callback
  test('mount should be able to offer click response', (done: jest.DoneCallback) => {
    labelProps = generateLabelProps();

    labelProps.distanceUnits = WeavessTypes.DistanceUnits.km;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    labelProps.distance = 555.557;

    labelProps.selections.channels = [];
    // labelProps.selectedChannels = ['730b69ba-2721-48b8-aa4d-7bb95b65a553'];
    labelProps.events = generateUpdatedLabelEvents();

    // eslint-disable-next-line react/jsx-props-no-spreading
    wrapper = Enzyme.mount(<Label {...labelProps} />);

    setImmediate(() => {
      wrapper.update();

      labelContainer = wrapper.find('div.label-container-content-label');

      let containerStyle = labelContainer.get(0).props.className;
      expect(containerStyle).not.toContain('is-selected');

      let propSelection: any = wrapper.prop('selections');
      expect(propSelection.channels).toHaveLength(0);

      labelContainer.first().simulate('click');

      wrapper.update();

      labelContainer = wrapper.find('div.label-container-content-label');

      propSelection = wrapper.prop('selections');
      expect(propSelection.channels).toHaveLength(1);

      containerStyle = labelContainer.get(0).props.className;
      expect(containerStyle).toContain('is-selected');

      done();
    });
  });

  test('should be able to expand and collapse', () => {
    labelProps = generateLabelProps();

    labelProps.distanceUnits = WeavessTypes.DistanceUnits.km;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    labelProps.distance = 555.557;

    labelProps.selections.channels = [];
    labelProps.events = generateUpdatedLabelEvents();

    wrapper = Enzyme.mount(<Label {...labelProps} />);

    wrapper.update();

    expect(wrapper.prop('expanded')).toBeFalsy();
    labelContainer = wrapper.find('div.label-container-left-parent-expansion-button');
    expect(labelContainer.text()).toEqual('+');
    expect(labelContainer.get(0).props['data-cy']).toEqual('weavess-expand-parent');

    labelContainer.first().simulate('click');

    wrapper.update();

    expect(wrapper.prop('expanded')).toBeTruthy();
    labelContainer = wrapper.find('div.label-container-left-parent-expansion-button');

    expect(labelContainer.text()).toEqual('-');

    labelContainer.first().simulate('click');
    wrapper.update();

    expect(wrapper.prop('expanded')).toBeFalsy();
    labelContainer = wrapper.find('div.label-container-left-parent-expansion-button');
    expect(labelContainer.text()).toEqual('+');
  });

  test('should be able invoke context menu', () => {
    labelProps = generateLabelProps();
    labelProps.events = generateUpdatedLabelEvents();

    const onChannelLabelClick = jest.fn();
    labelProps.events.onChannelLabelClick = onChannelLabelClick;

    const event = {
      button: 2,
      ctrlKey: true,
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    const instance: any = new Label(labelProps);
    instance.onContextMenu(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(0);
    expect(event.stopPropagation).toHaveBeenCalledTimes(0);
    expect(onChannelLabelClick).toHaveBeenCalledTimes(0);

    instance.onContextMenu({ ...event, button: 0 });
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(onChannelLabelClick).toHaveBeenCalledTimes(1);
  });

  it('componentDidCatch', () => {
    wrapper.update();
    const instance: any = wrapper.find(Label).instance();
    const spy = jest.spyOn(instance, 'componentDidCatch');

    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toBeCalled();
  });
});
