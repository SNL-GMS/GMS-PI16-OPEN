import { createAcknowledgementCommands } from '../../../../src/ts/components/data-acquisition-ui/commands/acknowledgement-commands';
import { sohStatus } from '../../../__data__/data-acquisition-ui/soh-status-data';

describe('Acknowledgment commands', () => {
  const { stationSoh } = sohStatus.stationAndStationGroupSoh;
  const showAcknowledgeOverlay = jest.fn();
  const acknowledgementCommands = createAcknowledgementCommands(
    sohStatus,
    ['ABC', 'TEST'],
    showAcknowledgeOverlay
  );

  it('creates acknowledgement commands for stations that need attention', () => {
    stationSoh
      .filter(station => station.needsAttention)
      .forEach(station => {
        const foundSingleCommand = acknowledgementCommands.find(command =>
          command.searchTags.find(tag => tag === station.stationName)
        );
        expect(foundSingleCommand).toBeDefined();
      });
  });

  it('does not create acknowledgement commands for stations that do not need attention', () => {
    stationSoh
      .filter(station => !station.needsAttention)
      .forEach(station => {
        const foundSingleCommand = acknowledgementCommands.find(command =>
          command?.searchTags?.find(tag => tag === station?.stationName)
        );
        expect(foundSingleCommand).toBeUndefined();
      });
  });
});
