package gms.shared.waveform.accessor;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.waveform.repository.BridgedWaveformRepositoryFactory;
import org.apache.commons.lang3.Validate;

public class WaveformAccessorFactory {
  private WaveformAccessor waveformAccessor;
  private BridgedWaveformRepositoryFactory bridgedWaveformRepositoryFactory;
  private StationDefinitionAccessorFactory stationDefinitionAccessorFactory;
  private SystemConfig systemConfig;

  private WaveformAccessorFactory(SystemConfig systemConfig, BridgedWaveformRepositoryFactory bridgedWaveformRepositoryFactory,
      StationDefinitionAccessorFactory stationDefinitionAccessorFactory) {
    this.bridgedWaveformRepositoryFactory = bridgedWaveformRepositoryFactory;
    this.stationDefinitionAccessorFactory = stationDefinitionAccessorFactory;
    this.systemConfig = systemConfig;
  }

  /**
   * Creates an IOC factory to build the waveform repository and their dependencies
   *
   * @return WaveformAccessorFactory to create waveform Repository
   */
  public static WaveformAccessorFactory create(
      SystemConfig systemConfig,
      BridgedWaveformRepositoryFactory bridgedWaveformRepositoryFactory,
      StationDefinitionAccessorFactory stationDefinitionAccessorFactory) {
    Validate.notNull(systemConfig, "systemConfig must be provided");
    Validate.notNull(bridgedWaveformRepositoryFactory, "bridgedWaveformRepositoryFactory must be provided");
    Validate.notNull(stationDefinitionAccessorFactory, "stationDefinitionAccessorFactory must be provided");

    return new WaveformAccessorFactory(systemConfig, bridgedWaveformRepositoryFactory, stationDefinitionAccessorFactory);
  }

  public WaveformAccessor getWaveformAccessorInstance() {
    if (waveformAccessor == null) {

      waveformAccessor = WaveformAccessor.create(
          systemConfig,
          bridgedWaveformRepositoryFactory.getBridgedWaveformRepositoryInstance(),
          stationDefinitionAccessorFactory);
    }
    return waveformAccessor;
  }
}
