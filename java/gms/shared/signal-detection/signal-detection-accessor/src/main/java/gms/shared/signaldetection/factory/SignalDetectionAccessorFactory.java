package gms.shared.signaldetection.factory;

import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.signaldetection.accessor.BridgedSignalDetectionAccessor;
import gms.shared.signaldetection.accessor.RequestCachingSignalDetectionAccessor;
import gms.shared.signaldetection.api.SignalDetectionAccessorInterface;
import gms.shared.signaldetection.api.SignalDetectionRepositoryInterface;
import gms.shared.signaldetection.api.facet.SignalDetectionFacetingUtility;
import gms.shared.signaldetection.cache.util.RequestCache;
import gms.shared.signaldetection.converter.detection.FeatureMeasurementConverter;
import gms.shared.signaldetection.converter.detection.FeatureMeasurementConverterInterface;
import gms.shared.signaldetection.converter.detection.SignalDetectionConverter;
import gms.shared.signaldetection.converter.detection.SignalDetectionConverterInterface;
import gms.shared.signaldetection.converter.detection.SignalDetectionHypothesisConverter;
import gms.shared.signaldetection.converter.detection.SignalDetectionHypothesisConverterInterface;
import gms.shared.signaldetection.database.connector.SignalDetectionDatabaseConnector;
import gms.shared.signaldetection.database.connector.util.SignalDetectionIdUtility;
import gms.shared.signaldetection.manager.config.SignalDetectionBridgeDefinition;
import gms.shared.signaldetection.repository.BridgedSignalDetectionRepository;
import gms.shared.stationdefinition.facet.StationDefinitionFacetingUtility;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.waveform.accessor.WaveformAccessorFactory;
import gms.shared.waveform.api.facet.WaveformFacetingUtility;
import gms.shared.workflow.coi.WorkflowDefinitionId;
import org.apache.commons.lang3.tuple.Pair;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class SignalDetectionAccessorFactory {

  public static final String PERSISTENCE_UNIT_NAME = "gms_signal_detection";

  private final StationDefinitionAccessorFactory stationDefinitionAccessorFactory;
  private final SignalDetectionBridgeDefinition signalDetectionBridgeDefinition;
  private final BridgedEntityManagerFactoryProvider bridgedEntityManagerFactoryProvider;
  private final SystemConfig systemConfig;
  private final WaveformAccessorFactory waveformAccessorFactory;

  private FeatureMeasurementConverterInterface featureMeasurementConverter;
  private SignalDetectionHypothesisConverterInterface signalDetectionHypothesisConverter;
  private SignalDetectionConverterInterface signalDetectionConverter;
  private SignalDetectionIdUtility signalDetectionIdUtility;
  private SignalDetectionRepositoryInterface signalDetectionRepository;
  private BridgedSignalDetectionAccessor bridgedSignalDetectionAccessor;
  private SignalDetectionFacetingUtility signalDetectionFacetingUtility;
  private RequestCachingSignalDetectionAccessor requestCachingSignalDetectionAccessor;

  private SignalDetectionAccessorFactory(StationDefinitionAccessorFactory stationDefinitionAccessorFactory,
    SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
    BridgedEntityManagerFactoryProvider bridgedEntityManagerFactoryProvider, SystemConfig systemConfig, WaveformAccessorFactory waveformAccessorFactory) {

    this.stationDefinitionAccessorFactory = stationDefinitionAccessorFactory;
    this.signalDetectionBridgeDefinition = signalDetectionBridgeDefinition;
    this.bridgedEntityManagerFactoryProvider = bridgedEntityManagerFactoryProvider;
    this.systemConfig = systemConfig;
    this.waveformAccessorFactory = waveformAccessorFactory;
  }

  public static SignalDetectionAccessorFactory create(StationDefinitionAccessorFactory stationDefinitionAccessorFactory,
    SignalDetectionBridgeDefinition signalDetectionBridgeDefinition,
    BridgedEntityManagerFactoryProvider bridgedEntityManagerFactoryProvider,
    SystemConfig systemConfig,
    WaveformAccessorFactory waveformAccessorFactory) {

    Objects.requireNonNull(stationDefinitionAccessorFactory,
      "StationDefinitionAccessorFactory cannot be null");
    Objects.requireNonNull(signalDetectionBridgeDefinition,
      "SignalDetectionBridgeDefinition cannot be null");
    Objects.requireNonNull(bridgedEntityManagerFactoryProvider,
      "BridgedEntityManagerFactoryProvider cannot be null");
    Objects.requireNonNull(systemConfig,
      "SystemConfig cannot be null");
    Objects.requireNonNull(waveformAccessorFactory,
      "WaveformAccessorFactory cannot be null");

    return new SignalDetectionAccessorFactory(stationDefinitionAccessorFactory,
      signalDetectionBridgeDefinition,
      bridgedEntityManagerFactoryProvider,
      systemConfig,
      waveformAccessorFactory);
  }

  /**
   * Get a {@link FeatureMeasurementConverterInterface} instance
   *
   * @return a {@link FeatureMeasurementConverterInterface} instance
   */
  public FeatureMeasurementConverterInterface getFeatureMeasurementConverterInstance() {
    if (featureMeasurementConverter == null) {
      featureMeasurementConverter = FeatureMeasurementConverter.create();
    }

    return featureMeasurementConverter;
  }

  /**
   * Get a {@link SignalDetectionHypothesisConverterInterface} instance
   *
   * @return a {@link SignalDetectionHypothesisConverterInterface} instance
   */
  public SignalDetectionHypothesisConverterInterface getSignalDetectionHypothesisConverterInstance() {
    if (signalDetectionHypothesisConverter == null) {
      signalDetectionHypothesisConverter =
        SignalDetectionHypothesisConverter.create(getFeatureMeasurementConverterInstance());
    }

    return signalDetectionHypothesisConverter;
  }

  /**
   * Get a {@link SignalDetectionConverterInterface} instance
   *
   * @return a {@link SignalDetectionConverterInterface} instance
   */
  public SignalDetectionConverterInterface getSignalDetectionConverterInstance() {
    if (signalDetectionConverter == null) {
      signalDetectionConverter = SignalDetectionConverter.create(getSignalDetectionHypothesisConverterInstance(),
        getSignalDetectionIdUtilityInstance(),
        signalDetectionBridgeDefinition.getOrderedStages());
    }

    return signalDetectionConverter;
  }

  /**
   * Get a {@link SignalDetectionIdUtility} instance
   *
   * @return a {@link SignalDetectionIdUtility} instance
   */
  public SignalDetectionIdUtility getSignalDetectionIdUtilityInstance() {
    if (signalDetectionIdUtility == null) {
      signalDetectionIdUtility = SignalDetectionIdUtility.create();
    }

    return signalDetectionIdUtility;
  }

  /**
   * Get a {@link SignalDetectionRepositoryInterface} instance
   *
   * @return a {@link SignalDetectionRepositoryInterface} instance
   */
  public SignalDetectionRepositoryInterface getSignalDetectionRepositoryInstance() {
    if (signalDetectionRepository == null) {
      List<WorkflowDefinitionId> orderedStages = signalDetectionBridgeDefinition.getOrderedStages();
      Map<WorkflowDefinitionId, String> databaseAccountsByName =
        signalDetectionBridgeDefinition.getDatabaseAccountByStage();
      Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> currentDatabaseConnectors = orderedStages
        .stream()
        .collect(Collectors.toMap(Function.identity(),
          stageId -> SignalDetectionDatabaseConnector.create(bridgedEntityManagerFactoryProvider
            .getEntityManagerFactory(PERSISTENCE_UNIT_NAME, databaseAccountsByName.get(stageId), systemConfig))));
      Map<WorkflowDefinitionId, SignalDetectionDatabaseConnector> previousDatabaseConnectors = IntStream.range(1, orderedStages.size())
        .mapToObj(index -> Pair.of(orderedStages.get(index),
          bridgedEntityManagerFactoryProvider.getEntityManagerFactory(PERSISTENCE_UNIT_NAME,
            databaseAccountsByName.get(orderedStages.get(index - 1)),
            systemConfig)))
        .collect(Collectors.toMap(Pair::getKey, pair -> SignalDetectionDatabaseConnector.create(pair.getValue())));

      signalDetectionRepository = new BridgedSignalDetectionRepository.Builder()
        .setSignalDetectionBridgeDefinition(signalDetectionBridgeDefinition)
        .setBridgedChannelRepository(stationDefinitionAccessorFactory.getBridgedChannelRepositoryInstance())
        .setCurrentStageDatabaseConnectors(currentDatabaseConnectors)
        .setPreviousStageDatabaseConnectors(previousDatabaseConnectors)
        .setSignalDetectionIdUtility(getSignalDetectionIdUtilityInstance())
        .setSignalDetectionHypothesisConverter(getSignalDetectionHypothesisConverterInstance())
        .setSignalDetectionConverter(getSignalDetectionConverterInstance())
        .createBridgedSignalDetectionRepository();
    }

    return signalDetectionRepository;
  }

  private RequestCachingSignalDetectionAccessor getRequestCachingSignalDetectionAccessorInstance() {
    if (requestCachingSignalDetectionAccessor == null) {
      requestCachingSignalDetectionAccessor = RequestCachingSignalDetectionAccessor.create(RequestCache.create(),
        getBridgedSignalDetectionAccessorInstance());
    }

    return requestCachingSignalDetectionAccessor;
  }

  private BridgedSignalDetectionAccessor getBridgedSignalDetectionAccessorInstance() {
    if (bridgedSignalDetectionAccessor == null) {
      bridgedSignalDetectionAccessor = BridgedSignalDetectionAccessor.create(getSignalDetectionRepositoryInstance(),
        waveformAccessorFactory.getWaveformAccessorInstance());
      bridgedSignalDetectionAccessor.setSignalDetectionFacetingUtility(getSignalDetectionFacetingUtilityInstance());
    }

    return bridgedSignalDetectionAccessor;
  }


  /**
   * Get a {@link SignalDetectionFacetingUtility} instance
   *
   * @return a {@link SignalDetectionFacetingUtility} instance
   */
  public SignalDetectionFacetingUtility getSignalDetectionFacetingUtilityInstance() {
    if (signalDetectionFacetingUtility == null) {
      signalDetectionFacetingUtility = SignalDetectionFacetingUtility.create(getBridgedSignalDetectionAccessorInstance(),
        WaveformFacetingUtility.create(waveformAccessorFactory.getWaveformAccessorInstance(),
          stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance()),
        StationDefinitionFacetingUtility
          .create(stationDefinitionAccessorFactory.getBridgedStationDefinitionAccessorInstance()));
    }

    return signalDetectionFacetingUtility;
  }

  /**
   * Get a {@link SignalDetectionFacetingUtility} instance
   *
   * @return a {@link SignalDetectionFacetingUtility} instance
   */
  public SignalDetectionAccessorInterface getSignalDetectionAccessorInstance() {
    return getRequestCachingSignalDetectionAccessorInstance();
  }

}
