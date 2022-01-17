package gms.shared.waveform.repository;

import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import gms.shared.stationdefinition.database.connector.WfdiscDatabaseConnector;
import gms.shared.waveform.converter.ChannelSegmentConvertImpl;
import javax.persistence.EntityManagerFactory;
import org.apache.commons.lang3.Validate;

/**
 * Manages creation of BridgedWaveformRepository
 */
public class BridgedWaveformRepositoryFactory {

  private EntityManagerFactory emf;
  private BridgedWaveformRepository bridgedWaveformRepository;
  private StationDefinitionManagerInterface stationDefinitionManagerInterface;

  private BridgedWaveformRepositoryFactory(
      EntityManagerFactory emf,
      StationDefinitionManagerInterface stationDefinitionManagerInterface){

    this.emf = emf;
    this.stationDefinitionManagerInterface = stationDefinitionManagerInterface;
  }

  public static BridgedWaveformRepositoryFactory create(EntityManagerFactory emf,
      StationDefinitionManagerInterface stationDefinitionManagerInterface) {
    Validate.notNull(emf,
        "EntityManagerFactory must be provided");
    Validate.notNull(stationDefinitionManagerInterface,
        "StationDefinitionManagerInterface must be provided");
    return new BridgedWaveformRepositoryFactory(emf, stationDefinitionManagerInterface);
  }
  public BridgedWaveformRepository getBridgedWaveformRepositoryInstance() {
    if (bridgedWaveformRepository == null) {
      bridgedWaveformRepository = BridgedWaveformRepository.create(
          WfdiscDatabaseConnector.create(emf),
          stationDefinitionManagerInterface,
          ChannelSegmentConvertImpl.create());
    }
    return bridgedWaveformRepository;
  }
}
