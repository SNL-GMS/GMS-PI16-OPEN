/* eslint-disable jest/no-commented-out-tests */

import { OpenAnythingDialog } from '../../../../../../../src/ts/components/analyst-ui/components/workflow/components/open-anything-dialog';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();
/*
const MOCK_TIME = 1609506000000;
const MOCK_TIME_STR = '2021-01-01 13:00:00';

const testDate: Date = new Date(MOCK_TIME);

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
mockDate.getMonth = () => testDate.getMonth();
mockDate.getFullYear = () => testDate.getFullYear();
mockDate.getDate = () => testDate.getDate();
mockDate.getMinutes = () => testDate.getMinutes();
Date.constructor = jest.fn(() => mockDate);
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock('~components/client-interface', () => ({
  ...jest.requireActual('~components/client-interface'),
  Queries: {
    ...jest.requireActual('~components/client-interface').Queries,
    OperationalTimePeriodConfigurationQuery: {
      useOperationalTimePeriodConfigurationQuery: jest.fn(() => ({
        data: {
          operationalPeriodStartSecs: FORTY_FIVE_DAYS_IN_SECONDS,
          operationalPeriodEndSecs: 0
        }
      }))
    },
    StationGroupQuery: {
      useStationGroupQuery: jest.fn(() => ({
        data: [{ name: 'mockStationGroup' }, { name: 'mockStationGroup' }]
      }))
    }
  }
}));

jest.mock('~analyst-ui/client-interface/axios/queries/workflow-query', () => ({
  ...jest.requireActual('~analyst-ui/client-interface/axios/queries/workflow-query'),
  useWorkflowQuery: jest.fn(() => ({
    data: {
      stages: [
        {
          name: 'mockStage',
          mode: WorkflowTypes.StageMode.INTERACTIVE,
          activities: [{ stationGroup: { name: 'mockStationGroup' } }]
        },
        {
          name: 'mockStage2',
          mode: WorkflowTypes.StageMode.AUTOMATIC,
          activities: [{ stationGroup: { name: 'mockStationGroup2' } }]
        }
      ]
    }
  }))
}));

jest.mock(
  '~components/client-interface/axios/queries/processing-analyst-configuration-query',
  () => ({
    useProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: { maximumOpenAnythingDuration: 7200 }
    }))
  })
);

jest.mock(
  '~components/client-interface/axios/queries/processing-station-group-names-configuration-query',
  () => ({
    useProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
      data: { stationGroupNames: ['mockStationGroup', 'mockStationGroup'] }
    }))
  })
);

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    ...jest.requireActual('moment'),
    utc: jest.fn(() => mMoment),
    format: jest.fn(() => MOCK_TIME_STR),
    default: {
      utc: jest.fn(() => mMoment)
    }
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    mMoment.default = {
      utc: jest.fn(() => mMoment)
    };
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.duration = jest.requireActual('moment').duration;
  fn.unix = () => ({ utc: () => mMoment });
  fn.utc = jest.fn(() => mMoment);
  return fn;
});

const TIME_TO_WAIT_MS = 200;
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
}; */

describe('Open Anything Dialog', () => {
  it('is exported', () => {
    expect(OpenAnythingDialog).toBeDefined();
  });

  /* Disabled pending Date picker refactor and integration */
  /*
  it('matches snapshot', () => {
    const componentHidden = Enzyme.mount(
      <OpenAnythingDialog isVisible={false} onCancel={jest.fn()} onOpen={jest.fn()} />
    );
    expect(componentHidden).toMatchSnapshot();

    const component = Enzyme.mount(
      <OpenAnythingDialog isVisible onCancel={jest.fn()} onOpen={jest.fn()} />
    );
    expect(component).toMatchSnapshot();
  });

  it('default values are called', async () => {
    const openAnythingConfirmationPrompt = jest.fn();
    const onOpen = jest.fn();
    const component = Enzyme.mount(
      <WorkflowContext.Provider
        value={{
          staleStartTime: 1,
          allActivitiesOpenForSelectedInterval: false,
          openConfirmationPrompt: jest.fn(),
          closeConfirmationPrompt: jest.fn(),
          openAnythingConfirmationPrompt
        }}
      >
        <BaseDisplay glContainer={glContainer}>
          <OpenAnythingDialog isVisible onCancel={jest.fn()} onOpen={onOpen} />
        </BaseDisplay>
      </WorkflowContext.Provider>
    );

    await waitForComponentToPaint(component);

    const openButton = component.find('button[data-cy="modal-action-button"]').first();
    openButton.simulate('click');

    expect(openAnythingConfirmationPrompt).toBeCalledWith({
      openIntervalName: 'mockStage',
      stationGroup: {
        name: 'mockStationGroup'
      },
      timeRange: {
        endTimeSecs: 1606816800,
        startTimeSecs: 1606809600
      }
    });
    expect(onOpen).toBeCalled();
  });

  it('values change', async () => {
    const openAnythingConfirmationPrompt = jest.fn();
    const onOpen = jest.fn();
    const component = Enzyme.mount(
      <WorkflowContext.Provider
        value={{
          staleStartTime: 1,
          allActivitiesOpenForSelectedInterval: false,
          openConfirmationPrompt: jest.fn(),
          closeConfirmationPrompt: jest.fn(),
          openAnythingConfirmationPrompt
        }}
      >
        <BaseDisplay glContainer={glContainer}>
          <OpenAnythingDialog isVisible onCancel={jest.fn()} onOpen={onOpen} />
        </BaseDisplay>
      </WorkflowContext.Provider>
    );

    await waitForComponentToPaint(component);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    component.find('DateRangePicker').prop('onNewInterval')(1602930240000, 1602930250000);

    component.find('HTMLSelect[title="Select processing stage"]').prop('onChange')({
      target: { value: 'mockStage2' }
    });

    component.find('HTMLSelect[title="Select station group"]').prop('onChange')({
      target: { value: 'mockStationGroup' }
    });

    const openButton = component.find('button[data-cy="modal-action-button"]').first();
    openButton.simulate('click');

    expect(openAnythingConfirmationPrompt).toBeCalledWith({
      openIntervalName: 'mockStage2',
      stationGroup: {
        name: 'mockStationGroup'
      },
      timeRange: {
        endTimeSecs: 1602930250,
        startTimeSecs: 1602930240
      }
    });
    expect(onOpen).toBeCalled();
  });

  it('invalid values are not useable', async () => {
    const openAnythingConfirmationPrompt = jest.fn();
    const onOpen = jest.fn();
    const component = Enzyme.mount(
      <WorkflowContext.Provider
        value={{
          staleStartTime: 1,
          openConfirmationPrompt: jest.fn(),
          closeConfirmationPrompt: jest.fn(),
          allActivitiesOpenForSelectedInterval: false,
          openAnythingConfirmationPrompt
        }}
      >
        <BaseDisplay glContainer={glContainer}>
          <OpenAnythingDialog isVisible onCancel={jest.fn()} onOpen={onOpen} />
        </BaseDisplay>
      </WorkflowContext.Provider>
    );

    await waitForComponentToPaint(component);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    component.find('DateRangePicker').prop('onNewInterval')(1502930240000, 1602930250000);

    component.find('HTMLSelect[title="Select processing stage"]').prop('onChange')({
      target: { value: 'mockStage2' }
    });

    component.find('HTMLSelect[title="Select station group"]').prop('onChange')({
      target: { value: 'mockStationGroup' }
    });

    const openButton = component.find('button[data-cy="modal-action-button"]').first();
    openButton.simulate('click');

    expect(openAnythingConfirmationPrompt).toBeCalledTimes(0);
    expect(onOpen).toBeCalledTimes(0);
  }); */
});
