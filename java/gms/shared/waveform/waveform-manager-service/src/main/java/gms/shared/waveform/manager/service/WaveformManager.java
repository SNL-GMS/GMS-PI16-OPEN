package gms.shared.waveform.manager.service;

import gms.shared.frameworks.client.generation.ClientGenerator;
import gms.shared.frameworks.control.ControlContext;
import gms.shared.frameworks.systemconfig.SystemConfig;
import gms.shared.stationdefinition.api.StationDefinitionManagerInterface;
import gms.shared.stationdefinition.cache.util.StationDefinitionCacheFactory;
import gms.shared.stationdefinition.database.connector.factory.StationDefinitionDatabaseConnectorFactory;
import gms.shared.stationdefinition.factory.StationDefinitionAccessorFactory;
import gms.shared.utilities.bridge.database.BridgedEntityManagerFactoryProvider;
import gms.shared.utilities.logging.StructuredLoggingWrapper;
import gms.shared.utilities.logging.TimingLogger;
import gms.shared.waveform.accessor.WaveformAccessorFactory;
import gms.shared.waveform.api.WaveformAccessorInterface;
import gms.shared.waveform.api.WaveformManagerInterface;
import gms.shared.waveform.api.util.ChannelSegmentDescriptorRequest;
import gms.shared.waveform.api.util.ChannelTimeRangeRequest;
import gms.shared.waveform.coi.ChannelSegment;
import gms.shared.waveform.coi.Waveform;
import gms.shared.waveform.repository.BridgedWaveformRepositoryFactory;
import org.slf4j.LoggerFactory;

import javax.persistence.EntityManagerFactory;
import java.util.Collection;

public class WaveformManager implements WaveformManagerInterface {

  private static final String SCHEMA = "schema";
  private static final String PERSISTENCE_UNIT = "gms_station_definition";

  private static final StructuredLoggingWrapper logger = StructuredLoggingWrapper
    .create(LoggerFactory.getLogger(WaveformManager.class));
  private WaveformAccessorInterface waveformAccessorImpl;
  private static final TimingLogger<Collection<ChannelSegment<Waveform>>> timingLogger =
    TimingLogger.create(logger);

  protected WaveformManager(WaveformAccessorInterface waveformAccessorImpl) {
    this.waveformAccessorImpl = waveformAccessorImpl;
  }

  public static WaveformManager create(ControlContext context) {
    logger.info("WaveformManager factory called");

    EntityManagerFactory emf = WaveformManager.getEntityManagerFactory(context);

    Runtime.getRuntime().addShutdownHook(new Thread(() -> emf.close()));

    try {
      StationDefinitionCacheFactory.setUpCache(context.getSystemConfig());
    } catch (IllegalStateException e) {
      logger.warn("Cache already initialized: ", e);
    }

    final WaveformAccessorFactory waveformAccessorFactory = WaveformAccessorFactory
      .create(context.getSystemConfig(),
        BridgedWaveformRepositoryFactory.create(
          emf,
          ClientGenerator.createClient(StationDefinitionManagerInterface.class)),
        StationDefinitionAccessorFactory.create(StationDefinitionDatabaseConnectorFactory.create(emf))
      );

    return new WaveformManager(
      waveformAccessorFactory.getWaveformAccessorInstance()
    );
  }

  public static EntityManagerFactory getEntityManagerFactory(ControlContext context) {
    final SystemConfig systemConfig = context.getSystemConfig();
    final BridgedEntityManagerFactoryProvider bridgedEntityManagerFactoryProvider = BridgedEntityManagerFactoryProvider
        .create();
    return bridgedEntityManagerFactoryProvider.getEntityManagerFactory(PERSISTENCE_UNIT, systemConfig);
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findWaveformsByChannelsAndTimeRange(
    ChannelTimeRangeRequest channelTimeRangeRequest) {

    if (channelTimeRangeRequest.getFacetingDefinition().isPresent()) {
      return timingLogger.apply("findWaveformsByChannelsAndTimeRange with FacetingDefinition",
        () -> waveformAccessorImpl.findByChannelsAndTimeRange(channelTimeRangeRequest.getChannels(),
          channelTimeRangeRequest.getStartTime(), channelTimeRangeRequest.getEndTime(),
          channelTimeRangeRequest.getFacetingDefinition().get()));
    }
    return timingLogger.apply("findWaveformsByChannelsAndTimeRange",
      () -> waveformAccessorImpl.findByChannelsAndTimeRange(channelTimeRangeRequest.getChannels(),
        channelTimeRangeRequest.getStartTime(), channelTimeRangeRequest.getEndTime()));
  }

  @Override
  public Collection<ChannelSegment<Waveform>> findWaveformsByChannelSegmentDescriptors(
    ChannelSegmentDescriptorRequest channelSegmentDescriptorRequest) {

    if (channelSegmentDescriptorRequest.getFacetingDefinition().isPresent()) {
      return timingLogger.apply("findWaveformsByChannelSegmentDescriptors with FacetingDefinition",
        () -> waveformAccessorImpl.findByChannelNamesAndSegmentDescriptor(
          channelSegmentDescriptorRequest.getChannelSegmentDescriptors(),
          channelSegmentDescriptorRequest.getFacetingDefinition().get()));
    }
    return timingLogger.apply("findWaveformsByChannelSegmentDescriptors",
      () -> waveformAccessorImpl.findByChannelNamesAndSegmentDescriptor(
        channelSegmentDescriptorRequest.getChannelSegmentDescriptors()));

  }
}
